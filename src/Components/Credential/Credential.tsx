import { useEffect, useState } from 'react';

import {
  Did,
  DidUri,
  IClaimContents,
  Credential,
  RequestForAttestation,
} from '@kiltprotocol/sdk-js';

import * as styles from './Credential.module.css';

import {
  getAttestationForRequest,
  getW3NOrDid,
  validateAttestation,
  validateCredential,
} from '../../Utils/verify-helper';

interface IDIDCredential {
  credential: unknown;
  did?: DidUri;
}

export function CredentialVerifier({ credential, did }: IDIDCredential) {
  const [claimContents, setClaimContents] = useState<IClaimContents>();
  const [isCredentialValid, setIsCredentialValid] = useState(true);
  const [attester, setAttester] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!did) return;

      if (Credential.isICredential(credential)) {
        setClaimContents(credential.request.claim.contents);
        setIsCredentialValid(await validateCredential(credential));
        const attesterDid = credential.attestation.owner;
        setAttester(await getW3NOrDid(attesterDid));
        return;
      }

      if (!RequestForAttestation.isIRequestForAttestation(credential)) {
        setIsCredentialValid(false);
        setError('Not valid Kilt Credential');
        return;
      }

      setClaimContents(credential.claim.contents);
      if (!Did.Utils.isSameSubject(credential.claim.owner, did)) {
        setIsCredentialValid(false);
        setError('Credential subject and signer DID are not the same');
        return;
      }

      const attestation = await getAttestationForRequest(credential);
      setIsCredentialValid(await validateAttestation(attestation));

      if (attestation) {
        setAttester(await getW3NOrDid(attestation.owner));
      } else {
        setError('No Attestation found');
      }
    })();
  }, [credential, did]);

  return (
    <div className={styles.credential}>
      {isCredentialValid &&
        claimContents &&
        Object.keys(claimContents).map((key, index) => (
          <div className={styles.property} key={index}>
            <span className={styles.name}>{key}</span>
            <span className={styles.value}>{String(claimContents[key])}</span>
          </div>
        ))}

      <div className={styles.property}>
        <span className={styles.name}>{error ? 'Error' : 'Attester'}</span>
        <span className={styles.value}>{error ? error : attester}</span>
      </div>

      <div className={styles.property}>
        <span className={styles.name}>Valid</span>
        <span
          className={
            isCredentialValid
              ? styles.credentialValid
              : styles.credentialInvalid
          }
        ></span>
      </div>
    </div>
  );
}
