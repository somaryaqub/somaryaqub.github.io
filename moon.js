const getMoonPhaseRotation = date => {
  const cycleLength = 29.5 // days

  const knownNewMoon = new Date('2022-03-02 18:34:00')
  const secondsSinceKnownNewMoon = (date - knownNewMoon) / 1000
  const daysSinceKnownNewMoon = secondsSinceKnownNewMoon / 60 / 60 / 24
  const currentMoonPhasePercentage = (daysSinceKnownNewMoon % cycleLength) / cycleLength

  return 360 - Math.floor(currentMoonPhasePercentage * 360)
}

const setMoonRotation = deg => {
  document.querySelector('.divider').style.transform = `rotate3d(0, 1, 0, ${deg}deg)`

  const hemispheres = document.querySelectorAll('.hemisphere')

  if (deg < 180) {
    // Left
    hemispheres[0].classList.remove('dark')
    hemispheres[0].classList.add('light')

    hemispheres[1].classList.add('dark')
    hemispheres[1].classList.remove('light')
  } else {
    hemispheres[0].classList.add('dark')
    hemispheres[0].classList.remove('light')

    hemispheres[1].classList.remove('dark')
    hemispheres[1].classList.add('light')
  }
}

const setMoonTitle = date => {
  document.querySelector('#date-title').innerHTML = ``
}

const today = new Date()
const dateSelect = document.querySelector('input')

dateSelect.addEventListener('input', e => {
  const selectedDate = new Date(e.target.value)

  setMoonTitle(selectedDate)
  setMoonRotation(getMoonPhaseRotation(selectedDate))
})

dateSelect.value = today.toISOString().slice(0, 10)

setMoonTitle(today)
setMoonRotation(getMoonPhaseRotation(today))



