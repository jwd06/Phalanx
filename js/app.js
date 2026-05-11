import calculate from './calculator.js'

export let currentUnit = 'metric'

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

document.getElementById('unit-metric').addEventListener('click', switchToMetric)
document.getElementById('unit-us').addEventListener('click', switchToUS)

// Calculate button
document.getElementById('calculate-button').addEventListener('click', calculate)
