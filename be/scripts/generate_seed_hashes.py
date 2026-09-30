from passlib.context import CryptContext
import json

pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
passwords = ["password1", "password2", "password3"]
hashes = [pwd.hash(p) for p in passwords]
print(json.dumps(hashes))
