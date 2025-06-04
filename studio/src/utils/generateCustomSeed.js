// src/utils/generateCustomSeed.js
import { keccak256, toUtf8Bytes } from 'ethers'

/**
 * Derivasi privateKey dari seedPhrase custom.
 * Di sini kita pakai keccak256("custom-prefix:" + normalizedPhrase)—
 * hasilnya adalah 32-byte hex, bisa langsung jadi privateKey.
 */
export function customSeedToPrivateKey(seedPhrase) {
  const normalized = seedPhrase.trim().toLowerCase()
  // “custom-prefix:” hanya contoh—boleh diganti, asalkan konsisten.
  const hash = keccak256(toUtf8Bytes("custom-prefix:" + normalized))
  return hash  // string hex sepanjang 66 karakter (0x + 64 hex)
}

/**
 * Mengambil 12 kata acak unik dari allwords.json (diletakkan di public/allwords.json)
 */
export async function generateCustomSeedPhrase() {
  const res = await fetch('/allwords.json')
  if (!res.ok) throw new Error("Gagal fetch allwords.json")
  const words = await res.json()

  const getRandom = () => words[Math.floor(Math.random() * words.length)]
  const seedSet = new Set()
  while (seedSet.size < 12) {
    seedSet.add(getRandom())
  }

  return Array.from(seedSet).join(' ')
}