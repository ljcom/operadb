const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const envPath = path.join(__dirname, '.env');
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

function hasKey(envContent, keyName) {
  const regex = new RegExp(`^${keyName}=`, 'm');
  return regex.test(envContent);
}

function createWallet(id) {
  const wallet = ethers.Wallet.createRandom();
  return {
    id,
    address: wallet.address,
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey
  };
}

let updates = [];

function addUserIfMissing(id) {
  if (!hasKey(env, `${id}_PRIVATE_KEY`)) {
    const user = createWallet(id);
    updates.push(`\n# === ${id} ===`);
    updates.push(`${id}_PRIVATE_KEY=${user.privateKey}`);
    updates.push(`${id}_PUBLIC_KEY=${user.publicKey}`);
    updates.push(`${id}_ADDRESS=${user.address}`);
    console.log(`✅ Generated ${id}: ${user.address}`);
  } else {
    console.log(`ℹ️  ${id} already exists in .env, skipped.`);
  }
}

// Cek dan buat USER1 dan USER2
addUserIfMissing('USER1');
addUserIfMissing('USER2');

// Simpan jika ada perubahan
if (updates.length > 0) {
  fs.appendFileSync(envPath, updates.join('\n') + '\n', 'utf-8');
  console.log('💾 Appended new keys to .env');
} else {
  console.log('✅ No update needed. All users already exist.');
}