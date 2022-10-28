import {
  Attestation,
  Credential,
  Did,
  DidUri,
  ICredential,
  IRequestForAttestation,
  KeyRelationship,
} from '@kiltprotocol/sdk-js';

import { base16 } from 'multiformats/bases/base16';
import * as zip from '@zip.js/zip.js';
import JSZip from 'jszip';
import { some } from 'lodash-es';

import { FileEntry } from '../Components/Files/Files';

import { createHash, createHashFromHashArray } from './sign-helpers';
import { IRemark, IVerifiedSignatureContents, SignDoc } from './types';
import { getVerifiedTimestamp } from './timestamp';

const resolveServiceEndpoints = async (did: DidUri) => {
  const didDetails = await Did.DidResolver.resolveDoc(did);
  const endPoints = didDetails?.details?.getEndpoints();
  if (endPoints) {
    return endPoints;
  } else {
    return [];
  }
};

export const getVerifiedData = async (jws: string, remark?: IRemark) => {
  if (jws === '') {
    return null;
  }
  const [header64, payload64, signature64] = jws.split('.');
  const header = atob(header64);
  const payload = atob(payload64);
  const signature = atob(signature64);
  const keyUri = JSON.parse(header).kid;
  const hash = JSON.parse(payload).hash;
  const { verified } = await Did.verifyDidSignature({
    message: hash,
    signature: { keyUri, signature },
    expectedVerificationMethod: KeyRelationship.authentication,
  });
  if (!verified) {
    return null;
  }

  const { did } = Did.Utils.parseDidUri(keyUri);
  const endpoints = await resolveServiceEndpoints(did);
  const w3name = await Did.Web3Names.queryWeb3NameForDid(did);
  const timestampWithTxHash = await getVerifiedTimestamp(signature, remark);
  const { txHash, timestamp } = timestampWithTxHash || {};
  return {
    did,
    signature,
    endpoints,
    w3name,
    timestamp,
    txHash,
  };
};

export async function unzipFileEntries(file: File): Promise<FileEntry[]> {
  const reader = new zip.ZipReader(new zip.BlobReader(file));
  const entries = await reader.getEntries();
  const fileEntries = entries.filter(({ getData }) => getData);
  const result = await Promise.all(
    fileEntries.map(async (entry) => {
      if (!entry.getData) throw new Error('Impossible: no entry.getData');
      const buffer = await entry.getData(new zip.Uint8ArrayWriter());
      const name = entry.filename;
      const file = new File([buffer], name);
      const hash = await createHash(buffer);
      return { file, buffer, name, hash };
    }),
  );
  await reader.close();
  return result;
}

export async function handleFilesFromZip(
  files: FileEntry[],
): Promise<(IVerifiedSignatureContents & { files: FileEntry[] }) | undefined> {
  const didSignFile = files.find(({ name }) => isDidSignFile(name));
  const doc: SignDoc = didSignFile
    ? JSON.parse(await didSignFile.file.text())
    : { jws: '', hashes: [] };

  const addMissingPrefix = (hash: string): string =>
    hash.startsWith(base16.prefix) ? hash : `${base16.prefix}${hash}`;
  const { jws, hashes, remark, credentials } = doc;
  const hashesWithPrefix = hashes.map((hash) => addMissingPrefix(hash));

  const baseHash = await createHashFromHashArray(hashesWithPrefix);
  const jwsBaseJson = atob(jws.split('.')[1]);
  const jwsBaseHash = addMissingPrefix(JSON.parse(jwsBaseJson).hash);

  const verifiedFiles = files.map((file) => ({
    ...file,
    verified: isDidSignFile(file.name) || hashesWithPrefix.includes(file.hash),
  }));
  if (baseHash !== jwsBaseHash || some(verifiedFiles, { verified: false })) {
    return undefined;
  }

  const verifiedContents = await getVerifiedData(jws, remark);
  if (!verifiedContents) {
    return undefined;
  }

  return {
    ...verifiedContents,
    credentials,
    files: verifiedFiles,
  };
}

export const getFileNames = async (file: File): Promise<string[]> => {
  const unzip = new JSZip();
  const unzipFile = await unzip.loadAsync(file);
  const filenames = Object.keys(unzipFile.files).filter((key) => {
    return !key.match(/^__MACOSX\//);
  });
  return filenames;
};

export function isDidSignFile(fileName: string) {
  return fileName.endsWith('.didsign');
}

export async function getW3NOrDid(did: DidUri): Promise<string> {
  const web3name = await Did.Web3Names.queryWeb3NameForDid(did);
  return web3name ? `w3n:${web3name}` : did;
}

export const getAttestationForRequest = async (
  req4Att: IRequestForAttestation,
) => {
  return Attestation.query(req4Att.rootHash);
};

export const validateAttestation = async (attestation: Attestation | null) => {
  if (attestation != null) {
    if (!attestation.revoked) {
      return true;
    }
  }
  return false;
};

export const validateCredential = async (
  credentialInput: ICredential,
): Promise<boolean> => {
  const credential = Credential.fromCredential(credentialInput);
  return await Credential.verify(credential);
};
