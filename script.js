// script.js — logic for KPOP-themed QR generator
// Clean, commented and modular for easy extension

// DOM references
const dataInput = document.getElementById('dataInput')
const generateBtn = document.getElementById('generateBtn')
const downloadPNG = document.getElementById('downloadPNG')
const downloadSVG = document.getElementById('downloadSVG')
const g1 = document.getElementById('g1')
const g2 = document.getElementById('g2')
const gradDir = document.getElementById('gradDir')
const dotStyle = document.getElementById('dotStyle')
const cornerStyle = document.getElementById('cornerStyle')
const logo = document.getElementById('logo')
const petal = document.getElementById('petal')
const ecLevel = document.getElementById('ecLevel')
const previewSize = document.getElementById('previewSize')
const qrWrap = document.getElementById('qr-wrap')
const presetButtons = document.querySelectorAll('[data-preset]')
const presetSelect = document.getElementById('presetSelect')
const currentPresetLabel = document.getElementById('currentPreset')
const scaleRange = document.getElementById('scaleRange')
const uiPreset = document.getElementById('uiPreset')

let qr = null

// Predefined K‑POP inspired presets
const PRESETS = {
  pastel: {
    g1: '#ff7cc7', g2: '#7c6bff', gradDir: '45', dotStyle: 'rounded', cornerStyle: 'dot', petal: true, frame: true
  },
  neon: {
    g1: '#00f5ff', g2: '#ff00d9', gradDir: '0', dotStyle: 'dots', cornerStyle: 'square', petal: false, frame: true
  },
  retro: {
    g1: '#ffd24d', g2: '#ff7cc7', gradDir: '90', dotStyle: 'square', cornerStyle: 'square', petal: false, frame: true
  }
}

// Create QR using qr-code-styling with conservative defaults
function createQRCode(options){
  // clean old
  qrWrap.innerHTML = ''

  const size = parseInt(previewSize.value || 360)

  const qrOptions = {
    width: size,
    height: size,
    data: options.data || '',
    image: options.image || undefined,
    dotsOptions: {color: options.color || '#000', type: options.dotStyle || 'rounded'},
    backgroundOptions: {color: 'transparent'},
    cornersSquareOptions: {type: options.cornerStyle || 'square'},
    cornersDotOptions: {type: options.cornerStyle || 'dot'},
    imageOptions: {crossOrigin: 'anonymous', margin:8}
  }

  // set error correction level
  qrOptions.qrOptions = {errorCorrectionLevel: options.ec || 'H'}

  qr = new QRCodeStyling(qrOptions)
  qr.append(qrWrap)

  // Post-process SVG for gradient, petal morph and frame
  setTimeout(()=>postProcessSVG(options), 80)
}

function postProcessSVG(options){
  const svg = qrWrap.querySelector('svg')
  if(!svg) return
  const ns = 'http://www.w3.org/2000/svg'

  // Ensure defs exists
  let defs = svg.querySelector('defs')
  if(!defs){defs = document.createElementNS(ns,'defs'); svg.prepend(defs)}

  // Build gradient
  const grad = document.createElementNS(ns,'linearGradient')
  const gradId = 'grad-'+Math.random().toString(36).slice(2,8)
  grad.setAttribute('id', gradId)
  const angle = parseInt(options.gradDir || 0)
  const rad = angle*Math.PI/180
  const x1 = (Math.cos(rad)+1)/2, y1=(Math.sin(rad)+1)/2
  grad.setAttribute('x1', x1); grad.setAttribute('y1', y1); grad.setAttribute('x2', 1-x1); grad.setAttribute('y2', 1-y1)
  const stop1 = document.createElementNS(ns,'stop'); stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color',options.g1)
  const stop2 = document.createElementNS(ns,'stop'); stop2.setAttribute('offset','100%'); stop2.setAttribute('stop-color',options.g2)
  grad.appendChild(stop1); grad.appendChild(stop2)
  defs.appendChild(grad)

  // Apply gradient fill to modules (dots)
  const dots = svg.querySelectorAll('.qr-code-styling__dots path, .qr-code-styling__dots rect, .qr-code-styling__dots circle')
  dots.forEach(n => n.setAttribute('fill', `url(#${gradId})`))

  // Optional petal morph - conservative to keep scannability
  if(options.petal){
    dots.forEach((node)=>{
      try{
        const bbox = node.getBBox()
        const cx = bbox.x + bbox.width/2
        const cy = bbox.y + bbox.height/2
        const rx = Math.min(bbox.width, bbox.height)/2
        const path = document.createElementNS(ns,'path')
        const d = `M ${cx} ${cy - rx} Q ${cx + rx*0.3} ${cy - rx*0.45} ${cx + rx*0.6} ${cy} Q ${cx + rx*0.3} ${cy + rx*0.45} ${cx} ${cy + rx} Q ${cx - rx*0.3} ${cy + rx*0.45} ${cx - rx*0.6} ${cy} Q ${cx - rx*0.3} ${cy - rx*0.45} ${cx} ${cy - rx} Z`
        path.setAttribute('d', d)
        path.setAttribute('fill', node.getAttribute('fill')||options.g1)
        path.setAttribute('transform', 'rotate(10 '+cx+' '+cy+')')
        node.parentNode.replaceChild(path, node)
      }catch(e){/* skip if cannot read bbox (some browsers) */}
    })
  }

  // Frame
  if(document.getElementById('frame').checked){
    const frame = document.createElementNS(ns,'rect')
    const w = parseFloat(svg.getAttribute('width')) || 360
    frame.setAttribute('x',6); frame.setAttribute('y',6)
    frame.setAttribute('width',w-12); frame.setAttribute('height',w-12)
    frame.setAttribute('rx',24); frame.setAttribute('ry',24)
    frame.setAttribute('fill','none'); frame.setAttribute('stroke','url(#'+gradId+')'); frame.setAttribute('stroke-width',8); frame.setAttribute('stroke-opacity',0.12)
    svg.appendChild(frame)
  }
}

// Build options from UI
function gatherOptions(){
  return {
    data: dataInput.value || '',
    g1: g1.value,
    g2: g2.value,
    gradDir: gradDir.value,
    dotStyle: dotStyle.value,
    cornerStyle: cornerStyle.value,
    image: logo.value || undefined,
    petal: petal.checked,
    ec: ecLevel.value
  }
}

// Apply preset to UI controls
function applyPreset(name){
  if(!PRESETS[name]) return
  const p = PRESETS[name]
  g1.value = p.g1
  g2.value = p.g2
  gradDir.value = p.gradDir
  dotStyle.value = p.dotStyle
  cornerStyle.value = p.cornerStyle
  petal.checked = !!p.petal
  document.getElementById('frame').checked = !!p.frame
  presetSelect.value = name
  currentPresetLabel.textContent = name.charAt(0).toUpperCase()+name.slice(1)
}

// Event handlers
generateBtn.addEventListener('click', ()=>{
  const options = gatherOptions()
  createQRCode(options)
})

downloadPNG.addEventListener('click',(e)=>{
  if(!qr) return
  qr.download({extension:'png'})
})

downloadSVG.addEventListener('click',(e)=>{
  if(!qr) return
  qr.download({extension:'svg'})
})

presetButtons.forEach(b=>b.addEventListener('click',(ev)=>{applyPreset(ev.currentTarget.dataset.preset);createQRCode(gatherOptions())}))

document.querySelectorAll('.preset-tile').forEach(b=>b.addEventListener('click', (ev)=>{applyPreset(ev.currentTarget.dataset.preset);createQRCode(gatherOptions())}))

// UI select -> apply
presetSelect.addEventListener('change',(e)=>{const v=e.target.value; if(v!=='custom'){applyPreset(v); createQRCode(gatherOptions())}})

// Scale preview
scaleRange.addEventListener('input',(e)=>{
  const s = parseFloat(e.target.value)
  qrWrap.style.transform = `scale(${s})`
})

// init
applyPreset('pastel')
createQRCode(gatherOptions())
