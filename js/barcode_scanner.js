let codeReader = null
let scannerControls = null
let isScanning = false


const TUNNEL_URL = null;

const API_BASE = TUNNEL_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/))
      ? `http://${window.location.hostname}:3000`
      : '');

async function startScanner() {
    if (!window.ZXingBrowser) { //checks whether zxing library is loaded, if not display it and return
        const status = document.getElementById('scanner-status')
        if (status) status.innerHTML = '<p style="color:red">Scanner library not loaded.</p>'
        return
    }

    // Force-abort any pending play() from a previous scan before ZXing touches the element
    const video = document.getElementById('scanner-video')
    video.srcObject = null //ensures a fresh start

    document.getElementById('scanner-overlay').classList.remove('hidden')
    try {
            //use universal module definition
            codeReader = new window.ZXingBrowser.BrowserMultiFormatReader() //creates new zxing browser instance 
            isScanning = true

            //opens camera and scans very frame until code num is found then returns an object which is later used by callback func
            scannerControls = await codeReader.decodeFromVideoDevice(undefined, 'scanner-video', (result) => {
                if (result && isScanning) {
                    onBarcodeDetected(result.getText())
                }
            })
        }
        catch (error) {
            if (!isScanning) return
            if (error.name === 'AbortError') return
            console.error('Scanner error:', error)
            const status = document.getElementById('scanner-status')
            if (error.name === 'NotAllowedError') {
                status.innerHTML = '<p style="color:red">Camera permission denied. Please allow camera access and try again.</p>'
            } else if (error.name === 'NotFoundError') {
                status.innerHTML = '<p style="color:red">No camera found on this device.</p>'
            } else if (error.name === 'NotSupportedError' || location.protocol !== 'https:' && location.hostname !== 'localhost') {
                status.innerHTML = '<p style="color:red">Camera requires HTTPS. Open the app over a secure connection.</p>'
            } else {
                status.innerHTML = '<p style="color:red">Failed to start camera. Check camera permissions.</p>'
            }
            stopScanner()
        }
}

function stopScanner() {
    const video = document.getElementById('scanner-video')
    const stream = video?.srcObject

    if (scannerControls) {
        try { 
            scannerControls.stop() 
        } catch (_) {}
        scannerControls = null
    }

    if (codeReader) {
        try { codeReader.reset() } catch (_) {}
        codeReader = null
    }

    isScanning = false

    if (stream) stream.getTracks().forEach(t => t.stop())
    if (video) video.srcObject = null

    document.getElementById('scanner-overlay').classList.add('hidden')
}

async function onBarcodeDetected(upc) {
    if (!isScanning) return
    isScanning = false
    stopScanner()

    const resultDiv = document.getElementById('result-nutrients')
    const placeholder = document.getElementById('results-placeholder')
    if (placeholder) placeholder.style.display = 'none'
    resultDiv.innerHTML = '<p>Fetching product details...</p>'

    try {
        const food = await fetchNutritionByUpc(upc)
        if (food) {
            renderNutritionResults(food) 
        }
        else {
            resultDiv.innerHTML = '<p>Product not found. Try searching by name instead. If stil no result, then ask Phalanx Copilot.</p>'
        }
    }

    catch(err) {
        console.error(err)
        const msg = err.name === 'AbortError' ? 'Request timed out. Try again.' : 'Could not connect to server. Try again.'
        resultDiv.innerHTML = `<p style="color:red">${msg}</p>`
    }
}

async function fetchNutritionByUpc(upc) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
        const response = await fetch(`${API_BASE}/api/barcode?upc=${encodeURIComponent(upc)}`, {
            signal: controller.signal
        }) 
        clearTimeout(timeout)

        if (response.status === 404) {return null}
        if (!response.ok) throw new Error('Server error')

        return await response.json()
    }
    catch(err){
        clearTimeout(timeout)
        throw err
    }
}

// Close button
document.getElementById('scanner-close-btn').addEventListener('click', stopScanner)

// Click on dark backdrop (outside the modal) also closes
document.getElementById('scanner-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) stopScanner()
})

// Escape key closes
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('scanner-overlay').classList.contains('hidden')) {
        stopScanner()
    }
})

function renderNutritionResults(foods) {
    const resultDiv = document.getElementById('result-nutrients')
    const placeholder = document.getElementById('food-results-placeholder')
    if (placeholder) placeholder.style.display = 'none'
    resultDiv.innerHTML = foods.map(food => `
        
        <button class="collapsible">${food.nameFood}</button>
        <div class="content">
            <div class="food-data"
                data-calories="${food.calories}"
                data-protein="${food.protein}"
                data-carbs="${food.carbs}"
                data-fat="${food.fat }"
            >
            <br>
            <label>Portion:
                <select class="portion-select">
                    ${food.portions.map((p, i) => 
                        `<option value="${p.gramWeight}" ${i === 0 ? 'selected' : ''}>${p.description} (${p.gramWeight} g)</option>`
                    ).join('')}
                </select>
            </label>
            <label class="custom-serving-label">
                Serving size: <input type="number" class="custom-serving-input" min="1" placeholder="e.g. 50"> g
            </label>
            <ul>
                <li><i class="fa-solid fa-fire"></i> Calories: <span class="cal">${food.calories}</span> kcal</li>
                <li><i class="fa-solid fa-drumstick-bite"></i> Protein: <span class="pro">${food.protein}</span> g</li>
                <li><i class="fa-solid fa-bread-slice"></i> Carbs: <span class="carb">${food.carbs}</span> g</li> 
                <li><i class="fa-solid fa-cheese"></i> Fat: <span class="fat">${food.fat}</span> g</li>
            </ul>
            </div>
        </div>

        `).join('<br>')
}
