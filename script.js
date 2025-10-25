const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const captureBtn = document.getElementById('capture');
const retakeBtn = document.getElementById('retake');
const downloadBtn = document.getElementById('download');
const countdownEl = document.getElementById('countdown');
const strip = document.getElementById('photoStrip');
const slots = [slot0, slot1, slot2];
let captured = [];
let activeFrame = 'black';
let activeFilter = 'none';

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}
startCamera();

const frames = [
    { id: 'black', bg: '#000', label: 'Black' },
    { id: 'white', bg: '#fff', label: 'White' },
    { id: 'pink', bg: '#ffc4d5', label: 'Pink' },
    { id: 'blue', bg: '#c5e5ff', label: 'Blue' },
    { id: 'yellow', bg: '#fff5a3', label: 'Yellow' },
    { id: 'macan', bg: 'url("assets/frames/macan.png") center/cover no-repeat', label: 'Macan' },
    { id: 'jeans', bg: 'url("assets/frames/jeans.png") center/cover no-repeat', label: 'Jeans' },
    { id: 'jeanshitam', bg: 'url("assets/frames/jeanshitam.png") center/cover no-repeat', label: 'Black Jeans' },
    { id: 'jeanspink', bg: 'url("assets/frames/jeanspink.png") center/cover no-repeat', label: 'Pink Jeans' },
    { id: 'macanrainbow', bg: 'url("assets/frames/macanrainbow.png") center/cover no-repeat', label: 'Macan Rainbow' },
    { id: 'zebra', bg: 'url("assets/frames/zebra.png") center/cover no-repeat', label: 'Zebra' },
    { id: 'checker', bg: 'repeating-linear-gradient(45deg,#000 0 15px,#fff 15px 30px)', label: 'Checker' },

];

frames.forEach(f => {
    const el = document.createElement('div');
    el.className = 'chip';
    el.style.background = f.bg;
    el.title = f.label;
    el.onclick = () => { activeFrame = f.id; applyFramePreview(); updateFrameActive(); };
    framePalette.appendChild(el);
});

function applyFramePreview() {
    const f = frames.find(x => x.id === activeFrame);
    strip.style.background = f.bg;
}
applyFramePreview();

function updateFrameActive() {
    [...framePalette.children].forEach(chip => {
        chip.classList.toggle('active', chip.title === frames.find(f => f.id === activeFrame).label);
    });
}


const filters = [
    { id: 'none', css: 'none' },
    { id: 'bw', css: 'grayscale(100%) contrast(110%)' },
    { id: 'sepia', css: 'sepia(70%) contrast(110%)' },
    { id: 'warm', css: 'brightness(105%) sepia(20%) saturate(120%)' },
];
filters.forEach(f => {
    const el = document.createElement('div');
    el.className = 'filter-chip';
    el.style.background = '#999';
    el.style.filter = f.css;
    el.onclick = () => { activeFilter = f.id; video.style.filter = f.css; updateFilterActive(); };
    filterPalette.appendChild(el);
});
function updateFilterActive() {
    [...filterPalette.children].forEach(chip => {
        chip.classList.toggle('active', chip.style.filter === filters.find(f => f.id === activeFilter).css);
    });
}

async function showCountdown() {
    for (let i = 3; i > 0; i--) {
        countdownEl.style.display = 'block';
        countdownEl.innerText = i;
        await new Promise(r => setTimeout(r, 1000));
    }
    countdownEl.style.display = 'none';
}

captureBtn.onclick = async () => {
    if (captured.length >= 3) { alert('Sudah 3 foto'); return; }
    await showCountdown();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.filter = video.style.filter;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const imgData = canvas.toDataURL('image/png');
    captured.push(imgData);
    slots[captured.length - 1].src = imgData;
};

retakeBtn.onclick = () => { captured = []; slots.forEach(s => s.src = ''); };

downloadBtn.onclick = async () => {
    if (captured.length < 3) { alert('Ambil 3 foto dulu'); return; }

    const W = 900, H = 2400, margin = 80, gap = 60;
    const photoH = (H - margin * 2 - gap * 2) / 3;
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const octx = out.getContext('2d');
    const f = frames.find(x => x.id === activeFrame);

    if (f.bg.startsWith('url(')) {
        const match = f.bg.match(/url\(["']?(.*?)["']?\)/);
        if (match) {
            await new Promise(res => {
                const frameImg = new Image();
                frameImg.crossOrigin = 'anonymous';
                frameImg.onload = () => {
                    octx.drawImage(frameImg, 0, 0, W, H);
                    res();
                };
                frameImg.src = match[1];
            });
        }
    } else {
        octx.fillStyle = f.bg;
        octx.fillRect(0, 0, W, H);
    }

    for (let i = 0; i < 3; i++) {
        await new Promise(res => {
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const photoW = W - 2 * margin;
                const trueH = photoW / aspect;
                const y = margin + i * (photoH + gap) + (photoH - trueH) / 2;
                octx.drawImage(img, margin, y, photoW, trueH);
                res();
            };
            img.src = captured[i];
        });
    }

    octx.font = "bold 60px 'Playfair Display'";
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.fillText("Photobooth", W / 2, H - 60);

    const link = document.createElement('a');
    link.download = 'photobooth_strip.png';
    link.href = out.toDataURL('image/png');
    link.click();
};
