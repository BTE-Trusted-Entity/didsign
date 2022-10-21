import React from 'react';

import * as styles from './BottomSection.module.css';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  clearEndpoint,
  clearFileStatuses,
} from '../../Features/Signer/VerifiedSignatureSlice';
import { useFiles } from '../Files/Files';
import { clearSign, selectSign } from '../../Features/Signer/SignatureSlice';
import {
  clearJWS,
  selectJwsSignStatus,
} from '../../Features/Signer/VerifyJwsSlice';
import { useHashes } from '../Hashes/Hashes';
import { DownloadButtons } from '../DownloadButtons/DownloadButtons';
import { SignButton } from '../SignButton/SignButton';
import { DidDocument } from '../DidDocument/DidDocument';

const InfoLink = () => {
  return (
    <div className={styles.infoLink}>
      <span className={styles.infoItem}>
        Don&apos;t have an on-chain DID yet?{' '}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://www.trusted-entity.io/assets/pdf/Upgrading-to-on-chain-DID.pdf"
        >
          Read here
        </a>
      </span>
      <span className={styles.infoItem}>
        Don&apos;t have a web3name yet?{' '}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://www.trusted-entity.io/assets/pdf/How_To_Guide_web3name_link_address_Full_May22.pdf"
        >
          Read here
        </a>
      </span>
    </div>
  );
};

export const BottomSectionSigner = () => {
  const dispatch = useAppDispatch();
  const setHashes = useHashes().set;
  const { setFiles, setZip } = useFiles();

  const handleDelete = () => {
    dispatch(clearSign());
    setFiles([]);
    setZip();
    setHashes([]);
  };
  const sign = useAppSelector(selectSign);
  return (
    <section className={styles.container}>
      <div className={styles.bottomSection}>
        {!sign ? <SignButton /> : <DownloadButtons />}

        {sign && (
          <button
            className={styles.startOverBtn}
            onClick={() => handleDelete()}
          />
        )}
      </div>
      <InfoLink />
    </section>
  );
};

export const BottomSectionVerifier = () => {
  const jwsStatus = useAppSelector(selectJwsSignStatus);
  const dispatch = useAppDispatch();
  const setHashes = useHashes().set;
  const { setFiles, setZip } = useFiles();

  const handleDelete = () => {
    dispatch(clearSign());
    setFiles([]);
    setZip();
    setHashes([]);
    dispatch(clearEndpoint());
    dispatch(clearJWS());
    dispatch(clearFileStatuses());
  };

  return (
    <section className={styles.container}>
      <div className={styles.bottomSection}>
        {jwsStatus === 'Validating' && (
          <span className={styles.verificationLoader} />
        )}

        {jwsStatus === 'Not Checked' && (
          <span className={styles.verificationText}>
            Verification <div></div>
          </span>
        )}

        <DidDocument />

        {jwsStatus === 'Verified' && (
          <button
            className={styles.startOverBtn}
            onClick={() => handleDelete()}
          />
        )}
      </div>
    </section>
  );
};
