import React, { Fragment } from 'react';
import { findIndex, without } from 'lodash-es';
import classnames from 'classnames';

import * as styles from './FilesVerifier.module.css';

import { useFiles } from '../Files/Files';
import { useVerifiedSignature } from '../VerifiedSignature/VerifiedSignature';
import { JWSStatus } from '../../Utils/types';

import { isDidSignFile } from '../../Utils/verify-helper';

export function FilesVerifier({
  jwsStatus,
  clearJWS,
  onDelete,
}: {
  jwsStatus: JWSStatus;
  clearJWS: () => void;
  onDelete: () => void;
}) {
  const { files, zip, setFiles, setZip } = useFiles();

  const { filesStatus, clearEndpoint, setVerifiedSignature } =
    useVerifiedSignature();

  const handleDeleteAll = () => {
    if (jwsStatus === 'Validating') {
      return;
    }

    clearEndpoint();
    setFiles([]);
    setZip();
    clearJWS();
    setVerifiedSignature((old) => ({ ...old, filesStatus: [] }));
  };

  const handleDeleteFile = (file: File) => {
    if (jwsStatus === 'Validating') return;

    const index = findIndex(files, { file });
    const fileEntry = files[index];
    const didSignFileDeleted = isDidSignFile(fileEntry.name);
    if (didSignFileDeleted) {
      setVerifiedSignature((old) => ({
        ...old,
        filesStatus: old.filesStatus.map(() => false),
      }));
      clearJWS();
    }

    if (jwsStatus !== 'Corrupted') {
      onDelete();
    }

    clearEndpoint();
    setVerifiedSignature((old) => ({
      ...old,
      filesStatus: [...old.filesStatus].splice(index, 1),
    }));
    setFiles((files) => without(files, fileEntry));
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <Fragment>
      {zip && (
        <div className={styles.zipContainer}>
          <div className={styles.zipFile}>
            <p className={styles.zipFilename}>{zip}</p>

            <button
              className={styles.deleteBtn}
              aria-label="Remove all files"
              onClick={handleDeleteAll}
            />
          </div>

          <h2 className={styles.heading}>Files</h2>

          <ul className={styles.list}>
            {files.map(({ name }, index) => (
              <li
                className={classnames(
                  filesStatus[index]
                    ? styles.unzippedFileOk
                    : styles.unzippedFileInvalid,
                )}
                key={index}
              >
                {isDidSignFile(name) ? (
                  <p className={styles.didsignFile}>{name}</p>
                ) : name.includes('png') || name.includes('jpg') ? (
                  <p className={styles.imageFile}>{name}</p>
                ) : (
                  <p className={styles.docFile}>{name}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!zip && (
        <div className={styles.container}>
          <h2 className={styles.heading}>Files</h2>

          <ul className={styles.list}>
            {files.map(({ file }, index) => (
              <li
                className={classnames(
                  filesStatus[index] ? styles.fileOk : styles.fileInvalid,
                )}
                key={index}
              >
                {isDidSignFile(file.name) ? (
                  <p className={styles.didsignFile}>{file.name}</p>
                ) : file.type.includes('image') ? (
                  <p className={styles.imageFile}>{file.name}</p>
                ) : (
                  <p className={styles.docFile}>{file.name}</p>
                )}

                <button
                  className={styles.deleteBtn}
                  aria-label="Remove file"
                  onClick={() => handleDeleteFile(file)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Fragment>
  );
}
