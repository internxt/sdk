export interface InitializeUserResponse {
  email: string
  bucket: string
  mnemonic: string
  root_folder_id: number
}

export interface ChangePasswordPayload {
  currentEncryptedPassword: string
  newEncryptedPassword: string
  newEncryptedSalt: string
  encryptedMnemonic: string
  encryptedPrivateKey: string
}
