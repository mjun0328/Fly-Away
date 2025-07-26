const useragt = navigator.userAgent.toLowerCase();
if (useragt.match(/kakaotalk/i)) {
  location.href =
    'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
} else if (useragt.match(/line/i)) {
  location.href = location.href + '?openExternalBrowser=1';
}

const changeTitle = (i) => {
  if (i > 4) return;
  const headerText = document.getElementsByClassName('header-text')[0];
  headerText.style.marginTop = `-${i * 2}rem`;
  setTimeout(() => {
    changeTitle(i + 1);
  }, 2000);
};
changeTitle(0);

// Change 'josa(조사)' labels when title input changes
document.getElementById('title-input').addEventListener('change', (e) => {
  const title = e.target.value;
  const josa = module.exports.josa.pick(title, '이/가');

  [
    document.getElementById('josa1-label'),
    document.getElementById('josa2-label'),
  ].forEach((label) => {
    label.innerHTML = `${title}<b>${label.dataset.value}</b> 날아가버렸으면 좋겠어`;
    if (josa === label.dataset.value) label.click();
  });
});

// Update canvas when user uploads an overlay image
let userOverlayImg = null;
document.getElementById('overlay-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    userOverlayImg = event.target.result;
    draw();
  };
  reader.readAsDataURL(file);
});

const draw = () => {
  // get input values
  const title = document.getElementById('title-input').value;
  const josa = document.querySelector('input[name="josa-input"]:checked').value;
  const author = document.getElementById('author-input').value;
  const illustrator = document.getElementById('illustrator-input').value;
  const translator = document.getElementById('translator-input').value;

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw background image
  const backgroundImg = new Image();
  backgroundImg.src = './asset/background.png';
  backgroundImg.onload = () => {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.save();

    // draw text of title
    ctx.shadowOffsetX = 1.3;
    ctx.shadowOffsetY = 1.3;
    ctx.shadowColor = 'rgba(0, 0, 0)';
    ctx.shadowBlur = 2;
    ctx.filter = 'blur(0.8px)';

    ctx.fillStyle = 'rgb(203, 79, 63)';
    ctx.font = '36px RixMomsBlanketR';
    ctx.fillText(josa, 216, 128);

    if (title.length >= 1) {
      ctx.font = '54px RixMomsBlanketR';
      ctx.fillText(title[title.length - 1], 172, 139);
    }
    if (title.length >= 2) {
      ctx.font = '58px RixMomsBlanketR';
      ctx.fillText(title[title.length - 2], 120, 127);
    }
    if (title.length >= 3) {
      ctx.font = '55px RixMomsBlanketR';
      ctx.fillText(title[title.length - 3], 67, 134);
    }

    // draw text of author
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.font = '12px Pretendard Variable';
    ctx.fillText(
      `${author} 글  |  ${illustrator} 그림  |  ${translator} 옮김`,
      229,
      240,
    );

    // draw overlay image
    const overlayImg = new Image();
    overlayImg.src = userOverlayImg || './asset/object.png';

    overlayImg.onload = () => {
      const {
        width: actualWidth,
        height: actualHeight,
        x: actualX,
        y: actualY,
      } = getActualImageDimensions(overlayImg);

      const moveX = parseInt(document.getElementById('x-input').value);
      const moveY = parseInt(document.getElementById('y-input').value);
      const scale = parseInt(document.getElementById('scale-input').value);
      const degree = parseInt(document.getElementById('degree-input').value);
      if (isNaN(moveX) || isNaN(moveY)) return;

      const ratio = (260 * scale) / 100 / Math.max(actualWidth, actualHeight);
      const overlayWidth = overlayImg.width * ratio;
      const overlayHeight = overlayImg.height * ratio;
      const overlayDegree = (Math.PI / 180) * degree;

      const overlayX = -(actualWidth / 2 + actualX) * ratio + moveX;
      const overlayY = -(actualHeight / 2 + actualY) * ratio + moveY;

      ctx.filter = 'blur(0.8px) brightness(1.2)';
      ctx.translate(canvas.width / 2, 400);
      ctx.rotate(overlayDegree);

      ctx.drawImage(
        overlayImg,
        overlayX,
        overlayY,
        overlayWidth,
        overlayHeight,
      );

      ctx.globalAlpha = 0.5;
      ctx.drawImage(
        overlayImg,
        overlayX + 2,
        overlayY,
        overlayWidth,
        overlayHeight,
      );
      ctx.drawImage(
        overlayImg,
        overlayX - 2,
        overlayY,
        overlayWidth,
        overlayHeight,
      );

      ctx.globalAlpha = 0.2;
      ctx.drawImage(
        overlayImg,
        overlayX + 10,
        overlayY,
        overlayWidth,
        overlayHeight,
      );
      ctx.drawImage(
        overlayImg,
        overlayX - 10,
        overlayY,
        overlayWidth,
        overlayHeight,
      );

      ctx.restore();
    };
  };
};

document.fonts.ready.then(() => {
  draw();
});

// Get actual image dimensions by removing transparent pixels
const getActualImageDimensions = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imgData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imgData.data;

  let minX = image.width,
    minY = image.height,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4;
      const alpha = data[index + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { width: 0, height: 0, x: 0, y: 0 };
  } else {
    const actualWidth = maxX - minX + 1;
    const actualHeight = maxY - minY + 1;

    return { width: actualWidth, height: actualHeight, x: minX, y: minY };
  }
};

// Download the image
const download = () => {
  const link = document.createElement('a');
  link.download = 'flyaway.png';
  document.getElementById('canvas').toBlob(function (blob) {
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(blob);
  }, 'image/png');
};

// Toolbox functions for modifying values(translate, rotate, scale)
const modifyValue = (e, delta) => {
  const input = e.target.parentElement.getElementsByTagName('input')[0];
  input.value = parseInt(input.value) + delta;
  draw();
};

const switchToolbox = () => {
  document.getElementById('toolbox-1').hidden =
    !document.getElementById('toolbox-1').hidden;
  document.getElementById('toolbox-2').hidden =
    !document.getElementById('toolbox-2').hidden;
};
