package hash

import (
	"crypto/sha256"
	"encoding/hex"
	"io"

	"golang.org/x/crypto/bcrypt"
)

// Password 对密码进行 bcrypt 哈希
func Password(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword 验证密码是否匹配
func CheckPassword(password, hashed string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password)) == nil
}

// FileSHA256 计算文件内容的 SHA-256 哈希
func FileSHA256(r io.Reader) (string, error) {
	h := sha256.New()
	if _, err := io.Copy(h, r); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
