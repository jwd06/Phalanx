import calculate, { refreshMacros } from './calculator.js'

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

//Event Listener for Unit switcher
document.getElementById('unit-metric').addEventListener('click', switchToMetric)
document.getElementById('unit-us').addEventListener('click', switchToUS)

//Event listener for Calorie Offset
document.getElementById('goal').addEventListener('change', (e) =>
{
    if (e.target.value === 'lose-weight') showWeightLossOffset()
    else if (e.target.value === 'gain-weight') showWeightGainOffset()
    else {
        document.getElementById('calorie-offset-weight-loss').style.display = 'none'
        document.getElementById('calorie-offset-weight-gain').style.display = 'none'
    }
})

// Macro mode switcher
const sliderIds   = { protein: 'proteins-slider', carbs: 'carbohydrates-slider', fat: 'fats-slider' }
const pctIds      = { protein: 'protein-pct',     carbs: 'carbs-pct',            fat: 'fats-pct'    }
const MACRO_BOUNDS = { protein: { min: 10, max: 35 }, carbs: { min: 45, max: 65 }, fat: { min: 20, max: 35 } }
const clamp = (key, val) => Math.min(MACRO_BOUNDS[key].max, Math.max(MACRO_BOUNDS[key].min, val))

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

document.getElementById('macro-balanced').addEventListener('click', () =>
{
    document.getElementById('macro-balanced').classList.add('active-macro')
    document.getElementById('macro-custom').classList.remove('active-macro')
    document.getElementById('macro-slider-selection').style.display = 'none'
    resetToBalanced()
    refreshMacros()
})

document.getElementById('macro-custom').addEventListener('click', () =>
{
    document.getElementById('macro-custom').classList.add('active-macro')
    document.getElementById('macro-balanced').classList.remove('active-macro')
    document.getElementById('macro-slider-selection').style.display = 'block'
})

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

// Calculate button
document.getElementById('calculate-button').addEventListener('click', calculate)
