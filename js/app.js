import calculate, { refreshMacros, redistributeCustomMacros } from './calculator.js'
import { getRecommendedPlan, renderExerciseDetails } from './personalized-workout.js'
import renderSchedule, { generateICS } from './workout.js'

export let currentUnit = 'metric'
export const macroPct = { protein: 30, carbs: 50, fat: 20 }
export let isDiabetic = false 
export let hasKidneyDisease = false

// Menu navigation
const menuIds = ['calorie-calculator', 'workout-split', 'food-nutrition']

//active diplay control (highlight effect)
const selectMenu = (id) =>
{
    if (typeof stopScanner === 'function') stopScanner()
    menuIds.forEach((s) =>
    {
        document.getElementById(s).style.display = 'none'
        document.getElementById(`menu-${s}`).classList.remove('active-menu') // acts as a master-reset switch, removes active (highlighted effects) by defualt
    })
    document.getElementById(id).style.display = 'block'
    document.getElementById(`menu-${id}`).classList.add('active-menu') //add the active state back
}

menuIds.forEach((id) =>
{
    document.getElementById(`menu-${id}`).addEventListener('click', () => selectMenu(id))
})

// Mark calorie-calculator active on load
document.getElementById('menu-calorie-calculator').classList.add('active-menu')

// Unit switcher
const switchToMetric = () =>
{
    currentUnit = 'metric'
    document.getElementById('unit-metric').classList.add('active-unit')
    document.getElementById('unit-us').classList.remove('active-unit')
    document.getElementById('height-metric').style.display = 'block'
    document.getElementById('height-us').style.display = 'none'
    document.getElementById('weight').placeholder = 'kg'
}

const switchToUS = () =>
{
    currentUnit = 'us'
    document.getElementById('unit-us').classList.add('active-unit')
    document.getElementById('unit-metric').classList.remove('active-unit')
    document.getElementById('height-metric').style.display = 'none'
    document.getElementById('height-us').style.display = 'block'
    document.getElementById('weight').placeholder = 'lbs'
}

const showWeightLossOffset = () =>
{
    document.getElementById('calorie-offset-weight-loss').classList.add('active-offset')
    document.getElementById('calorie-offset-weight-gain').classList.remove('active-offset')
    document.getElementById('calorie-offset-weight-gain').style.display = 'none'
    document.getElementById('calorie-offset-weight-loss').style.display = 'block'
}

const showWeightGainOffset = () =>
{
    document.getElementById('calorie-offset-weight-gain').classList.add('active-offset')
    document.getElementById('calorie-offset-weight-loss').classList.remove('active-offset')
    document.getElementById('calorie-offset-weight-loss').style.display = 'none'
    document.getElementById('calorie-offset-weight-gain').style.display = 'block'
}

//custom offset picker
const toggleCustomOffset = (e) =>
{
    if (e.target.value === 'custom-offset'){
        document.getElementById("custom-offset-picker").style.display = 'block'
    }
    else{
        document.getElementById("custom-offset-picker").style.display = 'none'
    }
}

//listener for custom offset 
document.getElementById("calorie-offset-wl").addEventListener('change', toggleCustomOffset)
document.getElementById("calorie-offset-wg").addEventListener('change', toggleCustomOffset)


//Event Listener for Unit switcher
document.getElementById('unit-metric').addEventListener('click', switchToMetric)
document.getElementById('unit-us').addEventListener('click', switchToUS)

//Event listener for Calorie Offset
document.getElementById('goal').addEventListener('change', (e) =>
{
    document.getElementById("custom-offset-picker").style.display = 'none'

    if (e.target.value === 'lose-weight') showWeightLossOffset()
    else if (e.target.value === 'gain-weight') showWeightGainOffset()
    else {
        document.getElementById('calorie-offset-weight-loss').style.display = 'none'
        document.getElementById('calorie-offset-weight-gain').style.display = 'none'
    }
})


document.getElementsByName("diabetes").forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === "yes"){
            isDiabetic = true
            document.getElementById("kidney-box").style.display = 'block'
            document.getElementById("extreme-wl").style.display = 'none'
            document.getElementById("extreme-wg").style.display = 'none'
            // reset Extreme selection to Normal if currently selected
            if (document.getElementById("calorie-offset-wl").value === "extreme"){
                document.getElementById("calorie-offset-wl").value = "normal"
            }
            if (document.getElementById("calorie-offset-wg").value === "extreme"){
                document.getElementById("calorie-offset-wg").value = "normal"
            }
        }
        else {
            isDiabetic = false
            hasKidneyDisease = false
            document.getElementById("kidney-box").style.display = 'none'
            document.getElementById("extreme-wl").style.display = ''
            document.getElementById("extreme-wg").style.display = ''
        }
    })
})

document.getElementsByName("kidney").forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === "yes"){
            hasKidneyDisease = true
        }
        else {
            hasKidneyDisease = false
        }
    })
})





// Macro mode switcher
const sliderIds   = { protein: 'proteins-slider', carbs: 'carbohydrates-slider', fat: 'fats-slider' }
// const pctIds   = { protein: 'protein-pct', carbs: 'carbs-pct', fat: 'fats-pct' }  // old AMDR % label IDs
//const MACRO_BOUNDS = { protein: { min: 10, max: 35 }, carbs: { min: 45, max: 65 }, fat: { min: 20, max: 35 } }
// const clamp = (key, val) => Math.min(MACRO_BOUNDS[key].max, Math.max(MACRO_BOUNDS[key].min, val))

/*
const setTrackFill = (slider) =>
{
    const min = parseFloat(slider.min)
    const max = parseFloat(slider.max)
    const pct = ((parseFloat(slider.value) - min) / (max - min)) * 100
    slider.style.background = `linear-gradient(to right, #1a73e8 ${pct}%, #d3d3d3 ${pct}%)`
}

const updateSliderUI = () =>
{
    for (const key of ['protein', 'carbs', 'fat']) {
        const slider = document.getElementById(sliderIds[key])
        slider.value = macroPct[key]
        document.getElementById(pctIds[key]).textContent = macroPct[key]
        setTrackFill(slider)
    }
}

const resetToBalanced = () =>
{
    macroPct.protein = 30
    macroPct.carbs   = 50
    macroPct.fat     = 20
    updateSliderUI()
}
*/

document.getElementById('macro-balanced').addEventListener('click', () =>
{
    document.getElementById('macro-balanced').classList.add('active-macro')
    document.getElementById('macro-custom').classList.remove('active-macro')
    document.getElementById('macro-slider-selection').style.display = 'none'
    refreshMacros()
})

document.getElementById('macro-custom').addEventListener('click', () =>
{
    document.getElementById('macro-custom').classList.add('active-macro')
    document.getElementById('macro-balanced').classList.remove('active-macro')
    document.getElementById('macro-slider-selection').style.display = 'block'
    refreshMacros()
})

/*
// Slider interdependency — keep protein + carbs + fat = 100, clamped to AMDR bounds
const onSliderChange = (changed, newVal) =>
{
    const [a, b] = ['protein', 'carbs', 'fat'].filter(k => k !== changed) //removes changed macros, two remains
    const remaining = 100 - newVal
    const oldSum = macroPct[a] + macroPct[b]

    let newA = oldSum === 0
        ? Math.round(remaining / 2)
        : clamp(a, Math.round(remaining * macroPct[a] / oldSum))

    let newB = clamp(b, remaining - newA)
    // If clamping b shifted the sum, recompute a to compensate
    newA = clamp(a, remaining - newB)

    macroPct[changed] = newVal
    macroPct[a] = newA
    macroPct[b] = newB

    updateSliderUI()
    refreshMacros()
}

for (const [key, sliderId] of Object.entries(sliderIds)) {
    document.getElementById(sliderId).addEventListener('input', (e) =>
    {
        onSliderChange(key, parseInt(e.target.value))
    })
}
*/

/*
// Old: simple refreshMacros call on every slider input
for (const sliderId of Object.values(sliderIds)) {
    document.getElementById(sliderId).addEventListener('input', () => refreshMacros())
}
*/

// Custom mode: redistribute proportionally to keep total = goal calories
// Balanced mode: sliders hidden, no action needed
for (const [key, sliderId] of Object.entries(sliderIds)) {
    document.getElementById(sliderId).addEventListener('input', (e) => {
        const isCustom = document.getElementById('macro-custom').classList.contains('active-macro')
        if (isCustom) redistributeCustomMacros(key, parseInt(e.target.value))
        else refreshMacros()
    })
}

document.getElementById('split-type').addEventListener('change', (e) =>{
    const isCustom = e.target.value === 'custom'
    const startDayWrapper = document.getElementById('start-day-wrapper')
    const generateBtn = document.getElementById('generate-split')
    const customFooter = document.getElementById('custom-split-footer')
    const workoutControls = document.querySelector('.workout-controls')

    document.getElementById('custom-split').style.display = isCustom ? 'block' : 'none'
    document.getElementById('download-button').style.display = 'none'
    document.getElementById('exercise-details-section').classList.add("hidden")
    lastGeneratedLabels = []

    if (isCustom) {
        customFooter.appendChild(startDayWrapper)
        customFooter.appendChild(generateBtn)
    } else {
        workoutControls.appendChild(startDayWrapper)
        workoutControls.appendChild(generateBtn)
    }
})



// Calculate button
document.getElementById('calculate-button').addEventListener('click', calculate)

// Reset button
document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('calculator-form').reset()
    document.getElementById('results').innerHTML = ''
    document.getElementById('macro-result').innerHTML = ''
    document.getElementById('mac-mode-selector').style.display = 'none'
    document.getElementById('macro-slider-selection').style.display = 'none'
    document.getElementById('results-placeholder').style.display = 'flex'
    document.getElementById('calorie-offset-weight-loss').style.display = 'none'
    document.getElementById('calorie-offset-weight-gain').style.display = 'none'
    document.getElementById('custom-offset-picker').style.display = 'none'
    document.getElementById('height-metric').style.display = 'block'
    document.getElementById('height-us').style.display = 'none'
    document.getElementById('weight').placeholder = 'kg'
    document.getElementById('recommended-plan-card').classList.add('hidden')
    document.getElementById('exercise-details-section').classList.add('hidden')
    document.getElementById('kidney-box').style.display = 'none'
    document.getElementById('extreme-wl').style.display = ''
    document.getElementById('extreme-wg').style.display = ''
    isDiabetic = false; hasKidneyDisease = false
})


let lastGeneratedLabels = [] //store the labels for export button 
let lastGeneratedDate = null
//Genrate Split
document.getElementById('generate-split').addEventListener('click', () =>{
    lastGeneratedDate = new Date()
    const splitType = document.getElementById('split-type').value
    const startDay = (splitType === 'custom') ? 0 : parseInt(document.getElementById('start-day').value)
    //parseInt(document.getElementById('start-day').value)

    
    
    //document.getElementById('download-button').style.display = 'block'

    if(splitType === 'custom'){
        const selects = document.querySelectorAll('.custom-day-select')
        const customDays = Array.from(selects).map(s => s.value)
        lastGeneratedLabels = renderSchedule(splitType, startDay, customDays)

        //renderSchedule('custom', startDay, customDays)
    }
    else lastGeneratedLabels = renderSchedule(splitType, startDay)
    //renderSchedule(splitType, startDay)

    const goal = document.getElementById('goal').value
    renderExerciseDetails(lastGeneratedLabels, goal, splitType)

    document.getElementById('download-button').style.display = 'block'
})

document.getElementById('download-schedule').addEventListener('click', () => {
    if (lastGeneratedLabels.length > 0){
        generateICS(lastGeneratedLabels, lastGeneratedDate)
    }
})

document.getElementById('recommended-plan-card').addEventListener('click', (e) => {
    if (e.target.id !== 'view-workout-btn') return

    const goal = document.getElementById('goal').value
    const activityLevel = document.getElementById('activity-level').value
    const plan = getRecommendedPlan(goal, activityLevel)

    selectMenu('workout-split')

    const splitTypeSelect = document.getElementById('split-type')
    splitTypeSelect.value = plan.splitType
    splitTypeSelect.dispatchEvent(new Event('change'))

    lastGeneratedLabels = renderSchedule(plan.splitType, 0)
    lastGeneratedDate = new Date()
    document.getElementById('download-button').style.display = 'block'

    renderExerciseDetails(lastGeneratedLabels, goal, plan.splitType)
})

//Ai chatbot 

const chatBtn = document.getElementById('chat-toggle-btn')
const chatWindow = document.getElementById('chat-window')

const openChat = () => {
    chatWindow.classList.add('visible')
    chatBtn.querySelector('i').className = 'fa-solid fa-xmark'
}

const closeChat = () => {
    chatWindow.classList.remove('visible')
    chatBtn.querySelector('i').className = 'fa-solid fa-robot'
}

chatBtn.addEventListener('click', () => {
    chatWindow.classList.contains('visible') ? closeChat() : openChat()
})

document.getElementById('chat-close-btn').addEventListener('click', closeChat)

//Get user data context from the result element
function gatherContext() {
    const parts = []
    const r = document.getElementById('results')?.innerText.trim()
    const m = document.getElementById('macro-result')?.innerText.trim()
    const s = document.getElementById('split-result')?.innerText.trim()

    if (r) parts.push('Calorie results:\n' + r)
    if (m) parts.push('Macro plan:\n' + m)
    if (s) parts.push('Workout split:\n' + s)
    return parts.join('\n\n')
}

//adding message bubble to chat window 
function buildTable(lines) {
    const isSep = l => /^\|[-:\s|]+\|$/.test(l.trim())
    const inlineRender = c => c
        .replace(/&lt;br&gt;/gi, '<br>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
    const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => inlineRender(c.trim()))
    const [header, ...body] = lines.filter(l => !isSep(l))
    let html = '<table class="chat-table"><thead><tr>'
    cells(header).forEach(c => html += `<th>${c}</th>`)
    html += '</tr></thead><tbody>'
    body.forEach(row => {
        html += '<tr>'
        cells(row).forEach(c => html += `<td>${c}</td>`)
        html += '</tr>'
    })
    return html + '</tbody></table>'
}

function renderMarkdown(text) {
    const escaped = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const lines = escaped.split('\n')
    const out = []
    let i = 0
    while (i < lines.length) {
        const cur = lines[i].trim()
        const next = lines[i + 1]?.trim()
        if (cur.startsWith('|') && next && /^\|[-:\s|]+\|$/.test(next)) {
            const block = []
            while (i < lines.length && lines[i].trim().startsWith('|')) block.push(lines[i++])
            out.push(buildTable(block))
        } else {
            out.push(lines[i++])
        }
    }

    return out.join('\n')
        .replace(/^---+$/gm, '')
        .replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[\*\-] (.+)$/gm, '• $1')
        .replace(/\n/g, '<br>')
}

function addBubble(text, role){
    const messages = document.getElementById('chat-message')
    const bubble = document.createElement('div')
    bubble.className = `chat-bubble ${role}`
    if (role === 'ai') {
        bubble.innerHTML = renderMarkdown(text)
    } else {
        bubble.textContent = text
    }
    messages.appendChild(bubble)
    messages.scrollTop = messages.scrollHeight
}

//sending message
async function sendMessage(){
   const input = document.getElementById('chat-input')
   const message = input.value.trim()
   if (!message) return
   addBubble(message, 'user')
   input.value = ''
   input.disabled = true
   
   const context = gatherContext()

   //ngrok for testing only
   const TUNNEL_URL = null;

   const API_BASE = TUNNEL_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/))
      ? `http://${window.location.hostname}:3000`
      : '');

    // Create the AI bubble immediately (empty, will fill as chunks arrive)
    const messages = document.getElementById('chat-message')
    const bubble = document.createElement('div')
    bubble.className = 'chat-bubble ai'
    bubble.textContent = '...'
    messages.appendChild(bubble)
    messages.scrollTop = messages.scrollHeight

    let fullText = ''

    try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    })
    const reader = res.body.getReader() //reads the flow of raw bytes
    const decoder = new TextDecoder() //TextDecoder object 
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n') 
        buffer = lines.pop() // keep incomplete last line for next read

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') break
            try { fullText += JSON.parse(payload) } catch {}
        }

        bubble.textContent = fullText
        messages.scrollTop = messages.scrollHeight
    }

    bubble.innerHTML = renderMarkdown(fullText)

    
   }
   catch {
    bubble.textContent = 'Error: could not reach server.'
   }
   finally {
    input.disabled = false
    input.focus()
    messages.scrollTop = messages.scrollHeight
   }
}

document.getElementById('chat-send-btn').addEventListener('click', sendMessage)
document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage()
})