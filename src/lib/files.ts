import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { uid } from './format';
import type { AttachmentKind } from './types';

export interface PickedFile {
  uri: string;
  kind: AttachmentKind;
  name: string;
}

function receiptsDir(): Directory {
  const dir = new Directory(Paths.document, 'receipts');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Copies a picked file into the app's permanent document directory. */
export async function persistFile(sourceUri: string, ext: string): Promise<string> {
  const source = new File(sourceUri);
  const dest = new File(receiptsDir(), `${uid()}.${ext}`);
  await source.copy(dest);
  return dest.uri;
}

export function deleteFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Missing files are fine to ignore.
  }
}

function extFromName(name: string | undefined, fallback: string): string {
  const match = name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

export async function takePhoto(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  return { uri: await persistFile(asset.uri, 'jpg'), kind: 'image', name: 'Receipt photo' };
}

export async function pickPhoto(): Promise<PickedFile | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  const ext = extFromName(asset.fileName ?? undefined, 'jpg');
  return { uri: await persistFile(asset.uri, ext), kind: 'image', name: asset.fileName ?? 'Photo' };
}

export async function pickDocument(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  const isPdf = asset.mimeType === 'application/pdf' || /\.pdf$/i.test(asset.name);
  const ext = extFromName(asset.name, isPdf ? 'pdf' : 'jpg');
  return { uri: await persistFile(asset.uri, ext), kind: isPdf ? 'pdf' : 'image', name: asset.name };
}

export async function readBase64(uri: string): Promise<string | null> {
  try {
    return await new File(uri).base64();
  } catch {
    return null;
  }
}
