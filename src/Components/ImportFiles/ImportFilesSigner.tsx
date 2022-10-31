import Dropzone from 'react-dropzone';
import { useCallback, useMemo, useState } from 'react';
import { without } from 'lodash-es';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

import * as styles from './ImportFiles.module.css';

import ImportIcon from '../../ImageAssets/iconBIG_import_NEW.svg';
import ReleaseIcon from '../../ImageAssets/iconBIG_import_release.svg';
import { FileEntry, FilesContext } from '../Files/Files';
import { createHash } from '../../Utils/sign-helpers';
import { FastAnimation, SlowAnimation } from '../Animation/Animation';
import { isDidSignFile } from '../../Utils/verify-helper';
import { SigningMultipleDidFiles } from '../Popups/Popups';
import { SignatureContext } from '../Signature/Signature';
import { Navigation } from '../Navigation/Navigation';
import { FilesEmpty } from '../FilesEmpty/FilesEmpty';
import { FilesSigner } from '../FilesSigner/FilesSigner';
import { SignButton } from '../SignButton/SignButton';
import { DownloadButtons } from '../DownloadButtons/DownloadButtons';
import { Signature } from '../../Utils/types';
import { InfoLink } from '../BottomSection/InfoLink';

export const ImportFilesSigner = () => {
  const [impIcon, setImportIcon] = useState<string>(ImportIcon);
  const [signErrorPopup, setSignErrorPopup] = useState<boolean>(false);

  const [files, setFiles] = useState<FileEntry[]>([]);
  const filesContext = useMemo(() => ({ files, setFiles }), [files]);

  const [signatureValues, setSignature] = useState<Signature>({});
  const signatureContext = useMemo(
    () => ({ ...signatureValues, setSignature }),
    [signatureValues],
  );
  const { signature, timestamped, downloaded } = signatureValues;

  const targetElement = document.querySelector('body');

  const handleDismiss = () => {
    setSignErrorPopup(false);
    if (targetElement != null) {
      enableBodyScroll(targetElement);
    }
  };

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (signature) {
        const didSignFile = files.find(({ name }) => isDidSignFile(name));
        if (!didSignFile) return;

        setFiles((files) => without(files, didSignFile));
        setSignature({});
      }
      acceptedFiles.forEach(async (file: File) => {
        setImportIcon(ImportIcon);

        const { name } = file;
        if (isDidSignFile(name)) {
          setSignErrorPopup(true);
          if (targetElement != null) {
            disableBodyScroll(targetElement);
          }
          return;
        }
        const buffer = await file.arrayBuffer();
        const hash = await createHash(buffer);
        setFiles((files) => [...files, { file, buffer, name, hash }]);
      });
    },
    [files, setFiles, setSignature, signature, targetElement],
  );

  const handleDelete = () => {
    setSignature({});
    setFiles([]);
  };

  return (
    <FilesContext.Provider value={filesContext}>
      <SignatureContext.Provider value={signatureContext}>
        <main className={styles.main}>
          <Navigation needWarning={timestamped && !downloaded} />
          <div className={styles.middleSection}>
            <div className={styles.container}>
              <Dropzone
                onDrop={handleDrop}
                onDragLeave={() => setImportIcon(ImportIcon)}
                onDragEnter={() => setImportIcon(ReleaseIcon)}
              >
                {({ getRootProps, getInputProps }) => (
                  <div className={styles.dropContainer} {...getRootProps({})}>
                    {impIcon == ImportIcon ? (
                      <SlowAnimation />
                    ) : (
                      <FastAnimation />
                    )}

                    <input {...getInputProps()} />
                    <img className={styles.importIcon} src={impIcon} />
                    {impIcon === ImportIcon && (
                      <span className={styles.signText}>Sign Your Files</span>
                    )}
                    {impIcon === ImportIcon && (
                      <span className={styles.dragDropText}>drag & drop</span>
                    )}
                    {impIcon === ImportIcon && (
                      <span className={styles.browseFilesText}>
                        or click / tap to browse your files
                      </span>
                    )}
                  </div>
                )}
              </Dropzone>

              {signErrorPopup && (
                <SigningMultipleDidFiles onDismiss={handleDismiss} />
              )}
            </div>

            {files.length === 0 ? <FilesEmpty /> : <FilesSigner />}
          </div>

          <section className={styles.bottomContainer}>
            <div className={styles.bottomSection}>
              {!signature ? <SignButton /> : <DownloadButtons />}

              {signature && (
                <button
                  className={styles.startOverBtn}
                  onClick={() => handleDelete()}
                />
              )}
            </div>
            <InfoLink />
          </section>
        </main>
      </SignatureContext.Provider>
    </FilesContext.Provider>
  );
};
