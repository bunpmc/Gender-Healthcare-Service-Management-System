def download_from_drive(file_id):
    creds = service_account.Credentials.from_service_account_file(
        os.getenv('GOOGLE_DRIVE_CREDENTIALS_FILE'),
        scopes=['https://www.googleapis.com/auth/drive'],
    )
    service = build('drive', 'v3', credentials=creds)
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        _, done = downloader.next_chunk()
    return fh.getvalue().decode('utf-8') #download into fh