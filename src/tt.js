const fs = require('fs');

// List of Dropbox URLs provided
const urls = [
  'https://www.dropbox.com/scl/fi/gjv8w7t2lvp4ckc5zsejm/400-Branded-Casserole-1500-ml.jpg?rlkey=ve0s69qik7rrc3x4h8ox9dvu8&dl=0',
  'https://www.dropbox.com/scl/fi/ckzr0sva584ju2u81bf63/400-Smart-White-RN.jpg?rlkey=uezx61gbcmloqpj5233kori87&dl=0',
  'https://www.dropbox.com/scl/fi/za628zog2ett3ikw4si4q/600-Power-Bank-10000-MAH.jpg?rlkey=1f5bsyc00dkuricxbp5xt08ul&dl=0',
  'https://www.dropbox.com/scl/fi/ii10sdeh1fm14z1aczlxa/600-SUMO-TRUNK-IE.jpg?rlkey=hhzdfbj8qt46df17ua3vrwpac&dl=0',
  'https://www.dropbox.com/scl/fi/p5raznajyajs59wl1ar8b/800-Earbuds.jpg?rlkey=moltucvckb4xsmdl2z24fgd86&dl=0',
  'https://www.dropbox.com/scl/fi/j6cgubw079atpylluk1zs/800-Branded-Duffle-Trolley.webp?rlkey=kh3dr13rl42d1g3y7xceiin2z&dl=0',
  'https://www.dropbox.com/scl/fi/kqbvdd00ydcgvex0hwpwj/1000-Power-Bank-20000-MAH.png?rlkey=j6pj527qs8ur8uhbrwpm8ix2q&dl=0',
  'https://www.dropbox.com/scl/fi/dr6aeqn5k6nqtqlgz75b3/1000-Branded-Smart-Watch.jpg?rlkey=0w0alugh0bpey9c4dunu1qy5e&dl=0',
  'https://www.dropbox.com/scl/fi/0qiyug27p5sntrlf398sh/1300-SS-Water-Jug-5-ltr.jfif?rlkey=n2eqww69560a3sevvp5i19s6x&dl=0',
  'https://www.dropbox.com/scl/fi/wu1a6l5u2rws8dj791h9d/1300-Branded-Ceiling-Fan-1200-mm.jpg?rlkey=qyb8pze1eo94emgw16eela22o&dl=0',
  'https://www.dropbox.com/scl/fi/hrcs7l7yalrbjmqwmsf2i/1600-Trimmer.png?rlkey=74hd1tuddp8pipc3d90jedu9u&dl=0',
  'https://www.dropbox.com/scl/fi/1djgyyw02wo9fcyc48n5u/1600-Headphone.jpg?rlkey=jmqon6s4gjapi72jklvgoc7k3&dl=0',
  'https://www.dropbox.com/scl/fi/goacz5g3alitmvls7yzr9/2000-Branded-Table-Fan.jpg?rlkey=xk8ekbfnq2cn4j0qz2gljapn0&dl=0',
  'https://www.dropbox.com/scl/fi/gjs24yumf9ej7vy79y95n/2000-jmg-mixer.jpg?rlkey=z40jc6yi8qj94fbu104aydk7t&dl=0',
  'https://www.dropbox.com/scl/fi/kjm6e54aadkbtc8j0s2zy/3000-Bluetooth-speaker-with-mic.jpg?rlkey=z5flue63x4xpzosye0u8wz5gm&dl=0',
  'https://www.dropbox.com/scl/fi/f2hbmq7dc86xywc4u386b/3000-Air-Coller-Mini.webp?rlkey=hio54pt1rizgt5dq500hjighr&dl=0',
  'https://www.dropbox.com/scl/fi/02rlpnt9b3gdraw9ne8fa/3500-Geyser-10-ltr.jpg?rlkey=n1t8v82pa9z65y4d4fr5kx3k8&dl=0',
  'https://www.dropbox.com/scl/fi/g86tu9cpxx570f2g2qdym/3500-Burner-Gas-Stove.jpg?rlkey=m90e5y88grta069cjiqg529eo&dl=0',
  'https://www.dropbox.com/scl/fi/qdr58kvaqfzd03ve2uwbs/5000-Smart-Phone.jpg?rlkey=3y0nhcg4vqp12b6inkss47fow&dl=0',
  'https://www.dropbox.com/scl/fi/fw3zjupyy2yv52gxeffk4/5000-Microwave-Oven-20-ltr.jpg?rlkey=8yc6xioc1wnsa3uyfit5yqa4h&dl=0',
  'https://www.dropbox.com/scl/fi/gdtd8gfguu81664ajrtlg/6500-Colour-Printer.jpg?rlkey=6o3ur4vc0hm3d4a0q0f968rkt&dl=0',
  'https://www.dropbox.com/scl/fi/1wru2etct0h9wv8lzybut/6500-Safe-Locker.jpg?rlkey=ic0aeypi1im38iplk3mqtzokc&dl=0',
  'https://www.dropbox.com/scl/fi/7ghiawa7pio828gvnnnmg/8000-LED-TV-32-inch.jpg?rlkey=xaim262xnq6s0dcc03zl35x1i&dl=0',
  'https://www.dropbox.com/scl/fi/530pdrwkxkyg2rz9auuwp/8000-Smart-Phone.jpg?rlkey=bxrw2zwrmun0ox2dyxlns8n8a&dl=0',
  'https://www.dropbox.com/scl/fi/ck9iiupjmc2v5lmpxit3g/12000-Washing-Machine.jpg?rlkey=bl9mb7nxv1qyt6k79303mm80i&dl=0',
  'https://www.dropbox.com/scl/fi/3m5340kj2r9evpqp54fah/16000-LED-TV-43-inch.jpg?rlkey=f08hnyl104kz6tq73uhta6by0&dl=0',
  'https://www.dropbox.com/scl/fi/u705hy83b0o2qz3vn71su/16000-Double-Door-Fridge-240L.jpg?rlkey=namnf8ldy5mlwuadv84gnht0o&dl=0',
  'https://www.dropbox.com/scl/fi/45a1ai0y92dew72o6c28w/18500-Laptop.jpg?rlkey=3qmkvtstm29iz9bifwcauxvr3&dl=0',
  'https://www.dropbox.com/scl/fi/5lzvoz6o6kzjpdfb4caze/21000-Split-AC.jpg?rlkey=cyhfxpi2oyxjzhcvnj4rg4gdm&dl=0',
  'https://www.dropbox.com/scl/fi/gp9yz661hj1pl4obf9v69/24000-Bangkok-pattaya.png?rlkey=dj11z6g0d7wew51m85g3hmc4b&dl=0',
  'https://www.dropbox.com/scl/fi/zurjahtkttlqmvasn2gn8/35000-Honda-Activa.jpg?rlkey=t4t99eyelue0koootclh5th40&dl=0',
  'https://www.dropbox.com/scl/fi/l527mocm4iay2xc5dez8v/41000-Honda-unicorn-BIke.jpg?rlkey=fmji635okg24sfxu0eqsvaxtd&dl=0',
];

// Function to generate cURL command for downloading an image
function generateCurlCommand(url) {
  // Extract the file name from the URL
  const fileName = url.match(/\/([^\/?]+)\?/)[1];
  // Modify the URL to use dl=1 for direct download
  const downloadUrl = url.replace('dl=0', 'dl=1');
  return `curl -o "downloads/${fileName}" "${downloadUrl}"`;
}

// Create a downloads directory if it doesn't exist
if (!fs.existsSync('downloads')) {
  fs.mkdirSync('downloads');
}

// Generate cURL commands for all URLs
const curlCommands = urls.map((url, index) => {
  const command = generateCurlCommand(url);
  console.log(`cURL Command for Image ${index + 1}: ${command}`);
  return command;
});

// Save cURL commands to a shell script
fs.writeFileSync('download_images.sh', curlCommands.join('\n'));

console.log('\nAll cURL commands have been generated and saved to download_images.sh');
console.log('To download all images, run: bash download_images.sh');