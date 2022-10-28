import React, {
  Fragment,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import BN from 'bn.js';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { BlockchainApiConnection } from '@kiltprotocol/chain-helpers';

import classnames from 'classnames';

import * as styles from './Timestamp.module.css';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  selectDownloadStatus,
  selectSign,
  updateTimestampStatus,
} from '../../Features/Signer/SignatureSlice';
import { useFiles } from '../Files/Files';

import {
  getExtrinsic,
  getFee,
  getKiltAccountsWithEnoughBalance,
  getTimestamp,
} from '../../Utils/timestamp';
import { IKiltAccount, SignDoc } from '../../Utils/types';
import { asKiltCoins } from '../../Utils/asKiltCoins';
import { exceptionToError } from '../../Utils/exceptionToError';

import { useConnect } from '../../Hooks/useConnect';
import { usePreventNavigation } from '../../Hooks/usePreventNavigation';

import { Spinner } from '../Spinner/Spinner';
import {
  PendingTx,
  SignPopup,
  TimestampError,
  useShowPopup,
} from '../Popups/Popups';

function getAccountLabel(account: IKiltAccount) {
  const { address, source, name } = account;

  return name ? `${name} (${source})` : `${address} (${source})`;
}

function useFee() {
  const [fee, setFee] = useState<BN>();

  useEffect(() => {
    (async () => {
      setFee(await getFee());
    })();
  }, []);

  return fee;
}

export function Timestamp() {
  useConnect();

  const signature = useAppSelector(selectSign);
  const { files, setFiles } = useFiles();
  const signatureDownloaded = useAppSelector(selectDownloadStatus);
  const showPopup = useShowPopup().set;

  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<
    | 'start'
    | 'getting-accounts'
    | 'accounts-ready'
    | 'signing'
    | 'finalizing'
    | 'done'
    | 'error'
  >('start');

  usePreventNavigation(
    ['finalizing', 'done'].includes(status) && !signatureDownloaded,
  );

  const [accounts, setAccounts] = useState<IKiltAccount[]>();
  const [selectedAccount, setSelectedAccount] = useState<IKiltAccount>();
  const [isAccountsMenuOpen, setIsAccountsMenuOpen] = useState(false);

  const [timestamp, setTimestamp] = useState('');

  const fee = useFee();

  const handleStartClick = useCallback(async () => {
    try {
      setStatus('getting-accounts');
      setAccounts(await getKiltAccountsWithEnoughBalance());
      setStatus('accounts-ready');
    } catch (exception) {
      setStatus('error');
      console.error(exceptionToError(exception));
    }
  }, []);

  const handleMenuOpen = useCallback(() => {
    setIsAccountsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsAccountsMenuOpen(false);
  }, []);

  const handleSelectClick = useCallback(
    (account: IKiltAccount) => () => {
      setSelectedAccount(account);
      setIsAccountsMenuOpen(false);
    },
    [],
  );

  const handleSelectKeyPress = useCallback(
    (account: IKiltAccount) => (event: KeyboardEvent) => {
      if (event.key !== 'Enter') {
        return;
      }
      setSelectedAccount(account);
      setIsAccountsMenuOpen(false);
    },
    [],
  );

  const remainingAccounts = useMemo(() => {
    return accounts?.filter((account) => account !== selectedAccount);
  }, [selectedAccount, accounts]);

  const handleFinalized = useCallback(
    async (blockHash: string, txHash: string) => {
      try {
        const decoder = new TextDecoder('utf-8');
        const decoded = decoder.decode(files[0].buffer);
        const didSignData = JSON.parse(decoded) as SignDoc;

        const withRemark = { ...didSignData, remark: { txHash, blockHash } };

        const blob = new Blob([JSON.stringify(withRemark)], {
          type: 'application/json;charset=utf-8',
        });
        const name = 'signature.didsign';
        const file = new File([blob], name);
        const buffer = await file.arrayBuffer();
        setFiles((files) => [{ file, buffer, name }, ...files.slice(1)]);

        setTimestamp(await getTimestamp(blockHash));

        setStatus('done');
        dispatch(updateTimestampStatus(true));
        showPopup(false);
      } catch (exception) {
        setStatus('error');
        console.error(exceptionToError(exception));
      }
    },
    [files, setFiles, dispatch, showPopup],
  );
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      showPopup(true);
      setStatus('signing');

      try {
        if (!selectedAccount) {
          throw new Error('No selected account');
        }

        const { api } = await BlockchainApiConnection.getConnectionOrConnect();

        const extrinsic = await getExtrinsic(signature);

        const injector = await web3FromAddress(selectedAccount.address);

        await extrinsic.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }) => {
            if (status.isReady) {
              setStatus('finalizing');
            }

            if (status.isFinalized && !dispatchError) {
              handleFinalized(
                status.asFinalized.toString(),
                extrinsic.hash.toString(),
              );
            }

            if (!dispatchError) {
              return;
            }

            if (!dispatchError.isModule) {
              // Other, CannotLookup, BadOrigin, no extra info
              throw new Error(dispatchError.toString());
            }

            const decoded = api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;

            throw new Error(`${section}.${name}: ${docs.join(' ')}`);
          },
        );
      } catch (exception) {
        const error = exceptionToError(exception);
        if (!error.message.includes('User closed the popup')) {
          setStatus('error');
          console.error(error);
        }
      }
    },
    [showPopup, selectedAccount, signature, handleFinalized],
  );

  function handleDismiss() {
    showPopup(false);
    accounts ? setStatus('accounts-ready') : setStatus('start');
  }

  function handleTryAgain() {
    showPopup(false);
    setStatus('start');
  }

  return (
    <div className={styles.container}>
      <div className={styles.timestamp}>
        <h3 className={styles.heading}>Timestamp</h3>

        {status === 'start' && (
          <section className={styles.section}>
            <p className={styles.fee}>
              Add a definite timestamp{' '}
              {fee ? `≈ (${asKiltCoins(fee)} KILT)` : <Spinner />}
            </p>
            <button
              className={styles.btn}
              onClick={handleStartClick}
              disabled={!fee}
            >
              Start
            </button>
          </section>
        )}
        {status === 'getting-accounts' && <Spinner />}

        {status === 'accounts-ready' && (
          <form onSubmit={handleSubmit}>
            <section className={styles.section}>
              <div className={styles.select} aria-expanded={isAccountsMenuOpen}>
                {!isAccountsMenuOpen && (
                  <button
                    className={classnames(
                      styles.openBtn,
                      Boolean(selectedAccount) && styles.selectedAccount,
                    )}
                    type="button"
                    onClick={handleMenuOpen}
                  >
                    {selectedAccount
                      ? getAccountLabel(selectedAccount)
                      : 'Select account'}
                  </button>
                )}

                {isAccountsMenuOpen && (
                  <Fragment>
                    <button
                      className={classnames(
                        styles.closeBtn,
                        Boolean(selectedAccount) && styles.selectedAccount,
                      )}
                      type="button"
                      onClick={handleMenuClose}
                    >
                      {selectedAccount
                        ? getAccountLabel(selectedAccount)
                        : 'Select account'}
                    </button>

                    <ul className={styles.options}>
                      {remainingAccounts?.map((account) => (
                        <li
                          className={styles.option}
                          key={account.address}
                          onClick={handleSelectClick(account)}
                          onKeyPress={handleSelectKeyPress(account)}
                          tabIndex={0}
                        >
                          <p>{getAccountLabel(account)}</p>
                        </li>
                      ))}
                    </ul>
                  </Fragment>
                )}
              </div>

              <button
                className={styles.btn}
                type="submit"
                disabled={!selectedAccount}
              >
                Create
              </button>
            </section>
          </form>
        )}

        {status === 'signing' && <SignPopup onDismiss={handleDismiss} />}

        {status === 'finalizing' && <PendingTx />}

        {status === 'done' && timestamp && (
          <section className={styles.section}>{timestamp}</section>
        )}

        {status === 'error' && <TimestampError onDismiss={handleTryAgain} />}
      </div>
    </div>
  );
}
