const { execSync } = require("child_process");
const path = require("path");

// Pastikan selalu berjalan dari root repositori
const rootDir = path.resolve(__dirname, "..");
process.chdir(rootDir);

function execQuiet(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", cwd: rootDir }).trim();
  } catch {
    return "";
  }
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: rootDir });
    return true;
  } catch (error) {
    console.error(`\n❌ Gagal mengeksekusi: ${cmd}`);
    process.exit(1);
  }
}

// 1. Dapatkan nama branch saat ini
const currentBranch = execQuiet("git branch --show-current") || "main";

// 2. Ambil pesan commit dari argumen CLI jika ada
const cliArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const nowStr = new Date().toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const commitMessage = cliArgs.length > 0 ? cliArgs.join(" ") : `update: ${nowStr}`;

console.log("\n========================================");
console.log("🚀 VIBRACHECK - ONE-CLICK GIT PUSH");
console.log("========================================");
console.log(`📌 Branch Target : ${currentBranch}`);
console.log(`💬 Pesan Commit  : "${commitMessage}"\n`);

// 3. Stage semua perubahan
console.log("📦 1/3 Staging file (git add .)...");
run("git add .");

// 4. Periksa status apakah ada yang perlu di-commit
const status = execQuiet("git status --porcelain");
if (!status) {
  console.log("ℹ️  2/3 Tidak ada perubahan baru yang perlu di-commit.");
} else {
  console.log("💾 2/3 Menyimpan commit...");
  // Escape quote ganda agar aman di Windows PowerShell maupun Bash
  const safeMsg = commitMessage.replace(/"/g, '\\"');
  try {
    execSync(`git commit -m "${safeMsg}"`, { stdio: "inherit", cwd: rootDir });
  } catch {
    console.log("⚠️  Tidak ada perubahan untuk di-commit.");
  }
}

// 5. Push ke GitHub remote
console.log(`\n⬆️  3/3 Mengunggah ke GitHub (git push origin ${currentBranch})...`);
run(`git push origin ${currentBranch}`);

console.log("\n🎉 BERHASIL! Semua perubahan sudah ter-push ke GitHub.\n");
