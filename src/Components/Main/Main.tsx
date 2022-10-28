import React, { Fragment, useEffect } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';

import * as styles from './Main.module.css';

import { ImportFilesSigner } from '../ImportFiles/ImportFilesSigner';
import { FilesSigner } from '../FilesSigner/FilesSigner';
import { useFiles } from '../Files/Files';
import { FilesEmpty } from '../FilesEmpty/FilesEmpty';
import { FilesVerifier } from '../FilesVerifier/FilesVerifier';
import { ImportFilesVerifier } from '../ImportFiles/ImportFilesVerifier';

import { paths } from '../../Utils/paths';
import {
  BottomSectionSigner,
  BottomSectionVerifier,
} from '../BottomSection/BottomSection';
import { useHashes } from '../Hashes/Hashes';
import { useSignature } from '../Signature/Signature';
import { useVerifiedSignature } from '../VerifiedSignature/VerifiedSignature';
import { useJWS } from '../JWS/JWS';
import { usePreventNavigation } from '../../Hooks/usePreventNavigation';
import { Terms } from '../Terms/Terms';
import { Privacy } from '../Privacy/Privacy';
import { Imprint } from '../Imprint/Imprint';
import { Navigation } from '../Navigation/Navigation';
import { Maintenance } from '../Maintenance/Maintenance';

const Signer = () => {
  const { files, setFiles, setZip } = useFiles();
  const { setSignature } = useSignature();
  const { clearJWS } = useJWS();
  const setHashes = useHashes().set;
  const { clearEndpoint, setVerifiedSignature } = useVerifiedSignature();

  useEffect(() => {
    clearEndpoint();
    clearJWS();
    setVerifiedSignature((old) => ({ ...old, filesStatus: [] }));
    setFiles([]);
    setZip();
    setHashes([]);
    setSignature({});
  }, [
    clearEndpoint,
    clearJWS,
    setFiles,
    setHashes,
    setSignature,
    setVerifiedSignature,
    setZip,
  ]);

  return (
    <main className={styles.container}>
      <Navigation />
      <div className={styles.middleSection}>
        <ImportFilesSigner />
        {files.length === 0 ? <FilesEmpty /> : <FilesSigner />}
      </div>
      <BottomSectionSigner />
    </main>
  );
};

const Verifier = () => {
  const { files, setFiles, setZip } = useFiles();
  const { setSignature } = useSignature();
  const setHashes = useHashes().set;

  //allows navigation prevented by time stamping
  usePreventNavigation(false);

  useEffect(() => {
    setFiles([]);
    setZip();
    setHashes([]);
    setSignature({});
  }, [setFiles, setHashes, setSignature, setZip]);

  return (
    <main className={styles.container}>
      <Navigation />
      <div className={styles.middleSection}>
        <ImportFilesVerifier />

        {files.length === 0 ? <FilesEmpty /> : <FilesVerifier />}
      </div>

      <BottomSectionVerifier />
    </main>
  );
};

export const Main = () => {
  return (
    <Routes>
      {process.env.REACT_APP_MAINTENANCE === 'true' ? (
        <Route path="*" element={<Maintenance />} />
      ) : (
        <Fragment>
          <Route path={paths.signer} element={<Signer />} />
          <Route path={paths.verifier} element={<Verifier />} />
          <Route path="*" element={<Navigate to={paths.signer} replace />} />
        </Fragment>
      )}

      <Route path={paths.terms} element={<Terms />} />
      <Route path={paths.privacy} element={<Privacy />} />
      <Route path={paths.imprint} element={<Imprint />} />
    </Routes>
  );
};
