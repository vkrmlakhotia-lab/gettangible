// src/lib/tangiblePhotos.test.ts
import { vi, describe, it, expect } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    convertFileSrc: (p: string) => `http://localhost/_capacitor_file_${p}`,
  },
  registerPlugin: () => ({
    fetchPhotos: vi.fn(),
    getPhotoFile: vi.fn(),
  }),
}))

const { fetchDevicePhotos, getPhotoFile } = await import('./tangiblePhotos')

describe('fetchDevicePhotos', () => {
  it('returns empty array on web', async () => {
    const result = await fetchDevicePhotos()
    expect(result).toEqual([])
  })
})

describe('getPhotoFile', () => {
  it('throws on web', async () => {
    await expect(getPhotoFile('abc')).rejects.toThrow('getPhotoFile is only available on native')
  })
})
