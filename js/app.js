import calculate, { refreshMacros, redistributeCustomMacros } from './calculator.js'
import renderSchedule, { generateICS } from './workout.js'

export let currentUnit = 'metric'
export const macroPct = { protein: 30, carbs: 50, fat: 20 }

// Menu navigation
const menuIds = ['calorie-calculator', 'workout-split', 'food-nutrition']

//active diplay control (highlight effect)
const selectMenu = (id) =>
{
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

    document.getElementById('download-button').style.display = 'block'
})

document.getElementById('download-schedule').addEventListener('click', () => {
    if (lastGeneratedLabels.length > 0){
        generateICS(lastGeneratedLabels, lastGeneratedDate)
    }
})
