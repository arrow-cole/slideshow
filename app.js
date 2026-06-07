const slideW = 13.333333;
const slideH = 7.5;
const emu = 914400;
const slides = [];
let selectedIndex = -1;
let isImporting = false;

const els = {
  bgInput: document.getElementById("bgInput"),
  chooseBtn: document.getElementById("chooseBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  dropZone: document.getElementById("dropZone"),
  fitSelect: document.getElementById("fitSelect"),
  importStatus: document.getElementById("importStatus"),
  moveDownBtn: document.getElementById("moveDownBtn"),
  moveUpBtn: document.getElementById("moveUpBtn"),
  noteInput: document.getElementById("noteInput"),
  photoInput: document.getElementById("photoInput"),
  preview: document.getElementById("slidePreview"),
  removeBtn: document.getElementById("removeBtn"),
  rotateInput: document.getElementById("rotateInput"),
  rotateValue: document.getElementById("rotateValue"),
  slideList: document.getElementById("slideList"),
  titleInput: document.getElementById("titleInput"),
};

els.chooseBtn.addEventListener("click", () => els.photoInput.click());
els.photoInput.addEventListener("change", (event) => addFiles(event.target.files));
els.downloadBtn.addEventListener("click", downloadPowerPoint);
els.fitSelect.addEventListener("change", updateSelectedFromControls);
els.bgInput.addEventListener("input", updateSelectedFromControls);
els.rotateInput.addEventListener("input", updateSelectedFromControls);
els.titleInput.addEventListener("input", updateSelectedFromControls);
els.noteInput.addEventListener("input", updateSelectedFromControls);
els.moveUpBtn.addEventListener("click", () => moveSelected(-1));
els.moveDownBtn.addEventListener("click", () => moveSelected(1));
els.removeBtn.addEventListener("click", removeSelected);

["dragenter", "dragover"].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((type) => {
  els.dropZone.addEventListener(type, () => els.dropZone.classList.remove("is-dragging"));
});

els.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  addFiles(event.dataTransfer.files);
});

async function addFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  isImporting = true;
  setImportStatus(`Adding ${files.length} photo${files.length === 1 ? "" : "s"}...`);
  syncControls();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const normalized = await normalizeImage(file);
    slides.push({
      ...normalized,
      background: "#111827",
      fit: "contain",
      note: "",
      rotate: 0,
      title: "",
    });
    setImportStatus(`Added ${i + 1} of ${files.length} photo${files.length === 1 ? "" : "s"}...`);
    await yieldToBrowser();
  }

  if (selectedIndex === -1 && slides.length) selectedIndex = 0;
  isImporting = false;
  setImportStatus(`${slides.length} photo${slides.length === 1 ? "" : "s"} ready. Add more anytime.`);
  els.photoInput.value = "";
  render();
}

async function normalizeImage(file) {
  const source = await fileToDataUrl(file);
  if (file.type === "image/png" || file.type === "image/jpeg") {
    const dims = await getImageDimensions(source);
    return {
      dataUrl: source,
      extension: file.type === "image/png" ? "png" : "jpg",
      height: dims.height,
      imageType: file.type,
      width: dims.width,
    };
  }

  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d").drawImage(image, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    extension: "jpg",
    height: image.naturalHeight,
    imageType: "image/jpeg",
    width: image.naturalWidth,
  };
}

function render() {
  renderList();
  renderPreview();
  syncControls();
}

function renderList() {
  els.slideList.innerHTML = "";
  if (!slides.length) {
    els.slideList.innerHTML = '<p class="meta">No photos yet.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.className = `slide-card ${index === selectedIndex ? "is-selected" : ""}`;
    button.type = "button";
    button.addEventListener("click", () => {
      selectedIndex = index;
      render();
    });
    button.innerHTML = `
      <span class="thumb"><img src="${slide.dataUrl}" alt=""></span>
      <span>
        <span class="slide-name">${escapeHtml(slide.title || `Slide ${index + 1}`)}</span>
        <span class="meta">Slide ${index + 1}</span>
      </span>
    `;
    fragment.append(button);
  });
  els.slideList.append(fragment);
}

function renderPreview() {
  const slide = slides[selectedIndex];
  if (!slide) {
    els.preview.style.background = "#111827";
    els.preview.innerHTML = `
      <div class="empty-state">
        <strong>Your slide will show here</strong>
        <span>Add photos to start building the deck.</span>
      </div>
    `;
    return;
  }

  els.preview.style.background = slide.background;
  els.preview.innerHTML = `
    <img class="preview-photo ${slide.fit}" src="${slide.dataUrl}" alt="">
    ${slide.title ? `<div class="preview-title">${escapeHtml(slide.title)}</div>` : ""}
  `;
  els.preview.querySelector(".preview-photo").style.transform = `rotate(${slide.rotate}deg)`;
}

function syncControls() {
  const slide = slides[selectedIndex];
  const enabled = Boolean(slide);
  [
    els.bgInput,
    els.fitSelect,
    els.moveDownBtn,
    els.moveUpBtn,
    els.noteInput,
    els.removeBtn,
    els.rotateInput,
    els.titleInput,
  ].forEach((control) => (control.disabled = !enabled));

  els.downloadBtn.disabled = !slides.length || isImporting;
  els.chooseBtn.disabled = isImporting;
  if (!slide) return;
  els.bgInput.value = slide.background;
  els.fitSelect.value = slide.fit;
  els.noteInput.value = slide.note;
  els.rotateInput.value = slide.rotate;
  els.rotateValue.textContent = `${slide.rotate} degrees`;
  els.titleInput.value = slide.title;
  els.moveUpBtn.disabled = selectedIndex <= 0;
  els.moveDownBtn.disabled = selectedIndex >= slides.length - 1;
}

function updateSelectedFromControls() {
  const slide = slides[selectedIndex];
  if (!slide) return;
  slide.background = els.bgInput.value;
  slide.fit = els.fitSelect.value;
  slide.note = els.noteInput.value;
  slide.rotate = Number(els.rotateInput.value);
  slide.title = els.titleInput.value;
  render();
}

function moveSelected(direction) {
  const nextIndex = selectedIndex + direction;
  if (nextIndex < 0 || nextIndex >= slides.length) return;
  const [slide] = slides.splice(selectedIndex, 1);
  slides.splice(nextIndex, 0, slide);
  selectedIndex = nextIndex;
  render();
}

function removeSelected() {
  if (selectedIndex < 0) return;
  slides.splice(selectedIndex, 1);
  selectedIndex = slides.length ? Math.min(selectedIndex, slides.length - 1) : -1;
  render();
}

async function downloadPowerPoint() {
  if (!slides.length || isImporting) return;
  els.downloadBtn.disabled = true;
  els.downloadBtn.textContent = `Building ${slides.length} slides...`;
  try {
    const blob = await buildPptx(slides);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "photo-slideshow.pptx";
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    els.downloadBtn.disabled = false;
    els.downloadBtn.textContent = "Download PowerPoint";
  }
}

async function buildPptx(deckSlides) {
  const zip = new SimpleZip();
  const hasNotes = deckSlides.some((slide) => slide.note);
  const contentTypes = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Default Extension="png" ContentType="image/png"/>',
    '<Default Extension="jpg" ContentType="image/jpeg"/>',
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
  ];

  if (hasNotes) {
    contentTypes.push('<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>');
  }

  deckSlides.forEach((_, i) => {
    contentTypes.push(`<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`);
    if (deckSlides[i].note) {
      contentTypes.push(`<Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`);
    }
  });
  contentTypes.push("</Types>");

  zip.file("[Content_Types].xml", contentTypes.join(""));
  zip.file("_rels/.rels", packageRels());
  zip.file("ppt/presentation.xml", presentationXml(deckSlides.length));
  zip.file("ppt/_rels/presentation.xml.rels", presentationRels(deckSlides.length));
  zip.file("ppt/slideMasters/slideMaster1.xml", slideMasterXml());
  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", slideMasterRels());
  zip.file("ppt/slideLayouts/slideLayout1.xml", slideLayoutXml());
  zip.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slideLayoutRels());
  zip.file("ppt/theme/theme1.xml", themeXml());
  if (hasNotes) {
    zip.file("ppt/notesMasters/notesMaster1.xml", notesMasterXml());
    zip.file("ppt/notesMasters/_rels/notesMaster1.xml.rels", notesMasterRels());
  }

  deckSlides.forEach((slide, i) => {
    const n = i + 1;
    zip.file(`ppt/slides/slide${n}.xml`, slideXml(slide, n));
    zip.file(`ppt/slides/_rels/slide${n}.xml.rels`, slideRels(n, slide.extension, Boolean(slide.note)));
    zip.file(`ppt/media/image${n}.${slide.extension}`, dataUrlToBytes(slide.dataUrl));
    if (slide.note) {
      zip.file(`ppt/notesSlides/notesSlide${n}.xml`, notesXml(slide.note));
      zip.file(`ppt/notesSlides/_rels/notesSlide${n}.xml.rels`, notesRels(n));
    }
  });

  return zip.generate("application/vnd.openxmlformats-officedocument.presentationml.presentation");
}

function presentationXml(count) {
  const slideIds = Array.from({ length: count }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slideIds}</p:sldIdLst>
  <p:sldSz cx="${Math.round(slideW * emu)}" cy="${Math.round(slideH * emu)}" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function presentationRels(count) {
  const rels = [
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
  ];
  for (let i = 0; i < count; i++) {
    rels.push(`<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`);
  }
  rels.push(`<Relationship Id="rId${count + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`);
  return relsXml(rels);
}

function slideXml(slide, slideNumber) {
  const bg = slide.background.replace("#", "").toUpperCase();
  const img = imagePlacement(slide);
  const title = slide.title ? titleShape(slide.title) : "";
  const rotate = Math.round(slide.rotate * 60000);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bg}"/></a:solidFill></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="Photo ${slideNumber}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm rot="${rotate}"><a:off x="${img.x}" y="${img.y}"/><a:ext cx="${img.cx}" cy="${img.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
      ${title}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function imagePlacement(slide) {
  const slideRatio = slideW / slideH;
  const imageRatio = slide.width / slide.height;
  let width = slideW;
  let height = slideH;

  if (slide.fit === "contain") {
    if (imageRatio > slideRatio) height = slideW / imageRatio;
    else width = slideH * imageRatio;
  } else if (imageRatio > slideRatio) {
    width = slideH * imageRatio;
  } else {
    height = slideW / imageRatio;
  }

  return {
    cx: Math.round(width * emu),
    cy: Math.round(height * emu),
    x: Math.round(((slideW - width) / 2) * emu),
    y: Math.round(((slideH - height) / 2) * emu),
  };
}

function titleShape(title) {
  return `<p:sp>
    <p:nvSpPr><p:cNvPr id="3" name="Slide Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="${Math.round(0.48 * emu)}" y="${Math.round(0.35 * emu)}"/><a:ext cx="${Math.round(12.35 * emu)}" cy="${Math.round(0.85 * emu)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3400" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>${escapeXml(title)}</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
  </p:sp>`;
}

function slideRels(slideNumber, extension, hasNotes) {
  const rels = [
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${slideNumber}.${extension}"/>`,
  ];
  if (hasNotes) {
    rels.push(`<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${slideNumber}.xml"/>`);
  }
  return relsXml(rels);
}

function notesXml(note) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    <p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="5715000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1400"/><a:t>${escapeXml(note)}</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:notes>`;
}

function notesRels(slideNumber) {
  return relsXml([
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>',
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNumber}.xml"/>`,
  ]);
}

function notesMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
</p:notesMaster>`;
}

function notesMasterRels() {
  return relsXml([
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>',
  ]);
}

function packageRels() {
  return relsXml([
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>',
  ]);
}

function slideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`;
}

function slideMasterRels() {
  return relsXml([
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>',
  ]);
}

function slideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
}

function slideLayoutRels() {
  return relsXml([
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>',
  ]);
}

function themeXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Photo Slideshow">
  <a:themeElements>
    <a:clrScheme name="Photo"><a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="172033"/></a:dk2><a:lt2><a:srgbClr val="F7F8FB"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="14B8A6"/></a:accent2><a:accent3><a:srgbClr val="F59E0B"/></a:accent3><a:accent4><a:srgbClr val="EF4444"/></a:accent4><a:accent5><a:srgbClr val="8B5CF6"/></a:accent5><a:accent6><a:srgbClr val="64748B"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="System"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Clean"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`;
}

function relsXml(rels) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join("")}</Relationships>`;
}

class SimpleZip {
  constructor() {
    this.files = [];
  }

  file(name, content) {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    this.files.push({ bytes, name });
  }

  generate(type) {
    const chunks = [];
    const central = [];
    let offset = 0;

    for (const entry of this.files) {
      const nameBytes = new TextEncoder().encode(entry.name);
      const crc = crc32(entry.bytes);
      const local = concatBytes([
        u32(0x04034b50),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(entry.bytes.length),
        u32(entry.bytes.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
        entry.bytes,
      ]);
      chunks.push(local);
      central.push(
        concatBytes([
          u32(0x02014b50),
          u16(20),
          u16(20),
          u16(0),
          u16(0),
          u16(0),
          u16(0),
          u32(crc),
          u32(entry.bytes.length),
          u32(entry.bytes.length),
          u16(nameBytes.length),
          u16(0),
          u16(0),
          u16(0),
          u16(0),
          u32(0),
          u32(offset),
          nameBytes,
        ]),
      );
      offset += local.length;
    }

    const centralOffset = offset;
    const centralBytes = concatBytes(central);
    const end = concatBytes([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(this.files.length),
      u16(this.files.length),
      u32(centralBytes.length),
      u32(centralOffset),
      u16(0),
    ]);

    return new Blob([concatBytes([...chunks, centralBytes, end])], { type });
  }
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function u16(value) {
  return Uint8Array.of(value & 255, (value >>> 8) & 255);
}

function u32(value) {
  return Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

function concatBytes(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function setImportStatus(message) {
  els.importStatus.textContent = message;
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function getImageDimensions(src) {
  const image = await loadImage(src);
  return { height: image.naturalHeight, width: image.naturalWidth };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
