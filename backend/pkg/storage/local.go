package storage

import (
	"io"
	"os"
	"path/filepath"
)

// LocalStorage 本地文件存储
type LocalStorage struct {
	baseDir string
}

func NewLocalStorage(baseDir string) *LocalStorage {
	os.MkdirAll(baseDir, 0755)
	return &LocalStorage{baseDir: baseDir}
}

// Save 保存文件，返回相对路径
func (s *LocalStorage) Save(subDir, filename string, r io.Reader) (string, error) {
	dir := filepath.Join(s.baseDir, subDir)
	os.MkdirAll(dir, 0755)

	relPath := filepath.Join(subDir, filename)
	fullPath := filepath.Join(s.baseDir, relPath)

	f, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := io.Copy(f, r); err != nil {
		return "", err
	}
	return relPath, nil
}

// FullPath 返回完整路径
func (s *LocalStorage) FullPath(relPath string) string {
	return filepath.Join(s.baseDir, relPath)
}

// BaseDir 返回存储根目录
func (s *LocalStorage) BaseDir() string {
	return s.baseDir
}
