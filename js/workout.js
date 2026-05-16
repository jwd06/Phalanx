const DAYS = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun']
const SPLITS =
{
    'ppl': ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
    'upper-lower': ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'],
    'full-body': ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest',  'Rest']
}

export default function renderSchedule(splitType, startDay, customDays = null){
    const schedule = (splitType === 'custom') ? customDays : SPLITS[splitType]
    //Rotate Schedule logic
    // Column one is day: column i (Mon=0, Tue=1 ... Sun=6)
    // Days are 7
    // Formula to rotate schedule based on startday: schedule[(i-startday + 7) % 7]

    const cells = DAYS.map((day, i) => {
        const label = (splitType === 'custom') ? schedule[i] : schedule[(i-startDay + 7) % 7]
        const isRest = (label === 'Rest')
        return(
            `
            <div class="split-cell ${isRest ? 'split-rest' : 'split-workout'}">
                <div class="split-day">${day}</div>
                <div class="split-label">${label}</div>
            </div>
            `
        )
    })
    document.getElementById('split-result').innerHTML = 
    `<div class="split-grid">${cells.join("")}</div>`
}



