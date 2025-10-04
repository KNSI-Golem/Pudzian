import magic
from uuid import uuid4
import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, UploadFile, status, HTTPException, Response
from .config import Settings
from functools import lru_cache
import logging
from backend.process.processor import Processor
from fastapi import Depends
from typing import Annotated
import os

KB = 1024
MB = 1024 * KB

app = FastAPI()
logger = logging.getLogger(__name__)


@lru_cache
def get_settings():
    return Settings()

def get_processor() -> Processor:
    return Processor()


session = boto3.Session(profile_name=get_settings().PROFILE)

s3 = session.resource('s3')
bucket = s3.Bucket(get_settings().AWS_BUCKET)


async def s3_download(key: str):
    try:
        bucket_name = get_settings().AWS_BUCKET
        return s3.Object(bucket_name=bucket_name, key=key).get()['Body'].read()
    except ClientError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='File not found'
        )


async def s3_upload(contents: bytes, key: str):
    bucket.put_object(Key=key, Body=contents)


def s3_download_file(key: str):
    try:
        bucket_name = get_settings().AWS_BUCKET
        filename = os.path.join('data', 'video', key)
        s3.Bucket(bucket_name).download_file(key, filename)
        return filename
    except ClientError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='File not found'
        )


@app.get('/api/video/download/{key}')
async def download_video(key: str):
    if key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No video ID provided'
        )

    contents = await s3_download(key=key)
    return Response(
        content=contents,
        headers={
            'Content-Disposition': f'attachment;filename={key}',
            'Content-Type': 'application/octet-stream',
        }
    )


@app.post("/api/video/upload")
async def upload_video(file: UploadFile):
    if file is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No file uploaded")

    contents = await file.read()
    file_size = len(contents)

    if file_size > 50 * MB:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="File size too large, max size is 50MB")

    file_type = magic.from_buffer(buffer=contents, mime=True)
    sup_files = get_settings().SUPPORTED_FILE_TYPES
    if file_type not in sup_files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="File type not supported. Supported types are: mp4, quicktime")

    id = f'{uuid4()}.{sup_files[file_type]}'

    await s3_upload(contents=contents, key=id)
    return {'file_name': id}


@app.get("/api/process/{key}")
def process_video(key: str, processor: Annotated[Processor, Depends(get_processor)]):
    if key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No video ID provided'
        )

    filename = s3_download_file(key)

    result = processor.process(filename)
    return {'result': result}
