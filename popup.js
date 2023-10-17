function saveApiKey(e) {
  e.preventDefault()

  const apiKeyInput = document.getElementById('apiKey').value

  chrome.storage.sync.set({ apiKey: apiKeyInput })

  handleApiKey(apiKeyInput)
}

function showApiKeyForm() {
  document.getElementById('api-key-form').style.display = 'block'
  document.getElementById('main-form').style.display = 'none'
}

function showMainForm() {
  document.getElementById('api-key-form').style.display = 'none'
  document.getElementById('main-form').style.display = 'block'
}

async function handleApiKey(apiKey) {
  const data = await fetchCurrencyData(apiKey)

  if (data) {
    updateAvailableCurrencies(data)

    showMainForm()
  }
}

async function calculate(e) {
  e.preventDefault()

  const cachedData = await chrome.storage.sync.get('currencyData')

  const conversions = cachedData.currencyData?.data
  if (!conversions) return

  const currencyFromInput = Number.parseFloat(document.getElementById('currencyFromInput').value)
  const currencyFromSelect = document.getElementById('currencyFromSelect').value
  const currencyToSelect = document.getElementById('currencyToSelect').value
  const taxRateFromInput = Number.parseFloat(document.getElementById('taxRateInput').value)

  const result = document.getElementById('result')

  const yearly =
    (conversions[currencyToSelect] * currencyFromInput) / conversions[currencyFromSelect]

  const monthly = yearly / 12

  const yearlyPostTax = yearly * ((100 - taxRateFromInput) / 100)

  const monthlyPostTax = monthly * ((100 - taxRateFromInput) / 100)

  result.innerText = `${Math.floor(yearlyPostTax)} ${currencyToSelect} a year, ${Math.floor(
    monthlyPostTax
  )} ${currencyToSelect} a month`
}

async function fetchCurrencyData(apiKey) {
  const cachedData = await chrome.storage.sync.get('currencyData')

  // don't fetch new currency data if the cached data is less than 6 hours old
  if (
    cachedData.currencyData?.updatedAt &&
    new Date(cachedData.currencyData?.updatedAt).getTime() + HOURS_6 >= new Date().getTime()
  ) {
    return cachedData.currencyData.data
  }

  const res = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}`)
  const fetchedData = await res.json()
  if (!fetchedData) return

  chrome.storage.sync.set({
    currencyData: { data: fetchedData.data, updatedAt: new Date().toUTCString() },
  })

  return fetchedData.data
}

function updateAvailableCurrencies(updatedData) {
  const currenciesAvailable = Object.keys(updatedData)

  const selectFrom = document.getElementById('currencyFromSelect')
  selectFrom.append(...generateCurrencyOptions(currenciesAvailable))

  const selectTo = document.getElementById('currencyToSelect')
  selectTo.append(...generateCurrencyOptions(currenciesAvailable))
}

function generateCurrencyOptions(currenciesAvailable) {
  return currenciesAvailable.map(currencySymbol => {
    const option = document.createElement('option')
    option.text = currencySymbol
    option.value = currencySymbol

    return option
  })
}

const HOURS_6 = 1000 * 60 * 60 * 6

document.addEventListener('DOMContentLoaded', async () => {
  const storedApiKey = await chrome.storage.sync.get('apiKey')

  if (storedApiKey.apiKey) {
    handleApiKey(storedApiKey.apiKey)
  } else {
    showApiKeyForm()
  }

  document.getElementById('saveApiKey').addEventListener('click', saveApiKey)
  document.getElementById('calculateButton').addEventListener('click', calculate)
})
