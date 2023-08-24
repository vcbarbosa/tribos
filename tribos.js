// ==UserScript==
// @name         JapexMarket v71
// @description  Automatically buy or sell resources based on price thresholds.
// @author       Japex, Scumzy & GPTex
// @version      3.1
// @match        https://*/game.php*screen=market*
// ==/UserScript==

;(function () {
    "use strict"
  
    // Utility Functions
    const getElementIfAvailable = (selector, maxTries) => {
      return new Promise((resolve, reject) => {
        let tries = 0
        const intervalId = setInterval(() => {
          const element = document.querySelector(selector)
          if (element && !element.disabled) {
            clearInterval(intervalId)
            resolve(element)
          } else {
            tries++
            if (tries > maxTries) {
              clearInterval(intervalId)
              reject(new Error("Max tries reached without finding the element."))
            }
          }
        }, 1000)
      })
    }
  
    const waitMilliseconds = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }
  
    const extractPriceFromElement = (element) => {
      return parseInt(element.textContent.trim(), 10)
    }
  
    const isSellable = (price, stock, sellThreshold, keepResources) => {
      return price < sellThreshold && stock - price * 1.2 > keepResources
    }
  
    const sellableTimes = (price, stock) => {
      return Math.floor((stock - price * 1.2) / price)
    }
  
    const isBuyable = (price, stock, buyThreshold, maxCapacity) => {
      return price > buyThreshold && stock + price * 0.9 < maxCapacity
    }
  
    const updateResourceDataInTable = () => {
      // Fetch threshold values
      const buyThresholdValue = parseFloat(document.getElementById("buyThreshold").value)
      const sellThresholdValue = parseFloat(document.getElementById("sellThreshold").value)
      const keepResourcesValue = parseFloat(document.getElementById("keepResources").value)
  
      // Fetch market prices and stock values
      const woodPrice = extractPriceFromElement(document.querySelector("#premium_exchange_rate_wood .premium-exchange-sep"))
      const stonePrice = extractPriceFromElement(document.querySelector("#premium_exchange_rate_stone .premium-exchange-sep"))
      const ironPrice = extractPriceFromElement(document.querySelector("#premium_exchange_rate_iron .premium-exchange-sep"))
  
      // Fetch available merchants
      const availableMerchants = document.querySelector("#market_merchant_available_count").textContent
      document.getElementById("availableMerchantsValue").innerText = availableMerchants
  
      const maxCapacity = parseInt(document.querySelector("#storage").textContent.trim(), 10)
  
      const woodStock = parseFloat(document.querySelector("#wood").innerText.replace(",", ""))
      const stoneStock = parseFloat(document.querySelector("#stone").innerText.replace(",", ""))
      const ironStock = parseFloat(document.querySelector("#iron").innerText.replace(",", ""))
  
      // Calculate Sellability and xTimes
      const woodSellable = isSellable(woodPrice, woodStock, sellThresholdValue, keepResourcesValue) ? "Yes" : "No"
      const stoneSellable = isSellable(stonePrice, stoneStock, sellThresholdValue, keepResourcesValue) ? "Yes" : "No"
      const ironSellable = isSellable(ironPrice, ironStock, sellThresholdValue, keepResourcesValue) ? "Yes" : "No"
  
      const woodBuyable = isBuyable(woodPrice, woodStock, buyThresholdValue, maxCapacity) ? "Yes" : "No"
      const stoneBuyable = isBuyable(stonePrice, stoneStock, buyThresholdValue, maxCapacity) ? "Yes" : "No"
      const ironBuyable = isBuyable(ironPrice, ironStock, buyThresholdValue, maxCapacity) ? "Yes" : "No"
  
      const woodTimes = woodSellable === "Yes" ? sellableTimes(woodPrice, woodStock) : 0
      const stoneTimes = stoneSellable === "Yes" ? sellableTimes(stonePrice, stoneStock) : 0
      const ironTimes = ironSellable === "Yes" ? sellableTimes(ironPrice, ironStock) : 0
  
      const woodTimesTrue = xTimesTrue(woodTimes, availableMerchants)
      const stoneTimesTrue = xTimesTrue(stoneTimes, availableMerchants)
      const ironTimesTrue = xTimesTrue(ironTimes, availableMerchants)
  
      // Populate table cells
      document.getElementById("woodPriceCell").innerText = woodPrice
      document.getElementById("stonePriceCell").innerText = stonePrice
      document.getElementById("ironPriceCell").innerText = ironPrice
  
      document.getElementById("woodStockCell").innerText = woodStock
      document.getElementById("stoneStockCell").innerText = stoneStock
      document.getElementById("ironStockCell").innerText = ironStock
  
      document.getElementById("woodSellableCell").innerText = woodSellable
      document.getElementById("stoneSellableCell").innerText = stoneSellable
      document.getElementById("ironSellableCell").innerText = ironSellable
  
      document.getElementById("woodTimesCell").innerText = woodTimes
      document.getElementById("stoneTimesCell").innerText = stoneTimes
      document.getElementById("ironTimesCell").innerText = ironTimes
  
      document.getElementById("woodTimesTrueCell").innerText = woodTimesTrue
      document.getElementById("stoneTimesTrueCell").innerText = stoneTimesTrue
      document.getElementById("ironTimesTrueCell").innerText = ironTimesTrue
  
      document.getElementById("woodBuyableCell").innerText = woodBuyable
      document.getElementById("stoneBuyableCell").innerText = stoneBuyable
      document.getElementById("ironBuyableCell").innerText = ironBuyable
  
      // Update Thresholds table
      document.getElementById("buyThresholdValue").innerText = buyThresholdValue
      document.getElementById("sellThresholdValue").innerText = sellThresholdValue
      document.getElementById("keepResourcesValue").innerText = keepResourcesValue
    }
  
    const xTimesTrue = (xTimes, availableMerchants) => {
      return Math.min(xTimes, availableMerchants)
    }
  
    const buyResource = async (resource) => {
      const resourceBuyInput = document.querySelector(`input[data-resource="${resource}"][data-type="buy"]`)
      const resourcePrice = extractPriceFromElement(
        document.querySelector(`#premium_exchange_rate_${resource} .premium-exchange-sep`)
      )
  
      // Enter price*0.5
      resourceBuyInput.value = resourcePrice * 0.5
  
      // Click "Calcular melhor oferta"
      const calculateOfferButton = await getElementIfAvailable(`.btn-premium-exchange-buy`, 10) // try to get the button 10 times
      calculateOfferButton.click()
  
      // Click "Confirmar"
      const confirmButton = await getElementIfAvailable(`button.btn-confirm-yes`, 10) // try to get the button 10 times
      confirmButton.click()
    }
  
    const buyResources = async () => {
      console.log("Buying resources...")
      const calculateOfferButton = await getElementIfAvailable(`.btn-premium-exchange-buy`, 10)
      if (calculateOfferButton !== null && calculateOfferButton.disabled) {
          console.log("❌ Not buying resources because the button is unavailable.")
          return
      }
  
      const buyThresholdValue = parseFloat(document.getElementById("buyThreshold").value)
      const maxCapacity = parseInt(document.querySelector("#storage").textContent.trim(), 10)
      const resources = ["wood", "stone", "iron"]
  
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i]
        const stock = parseFloat(document.querySelector(`#${resource}`).innerText.replace(",", ""))
        const price = extractPriceFromElement(document.querySelector(`#premium_exchange_rate_${resource} .premium-exchange-sep`))
        if (isBuyable(price, stock, buyThresholdValue, maxCapacity)) {
          console.log(`✅ Buying ${resource}...`)
          await buyResource(resource)
        } else {
          console.log(`❌ Not buying ${resource} because it is not buyable.`)
        }
      }
    }
  
    // Control Panel HTML
    const controlPanelHTML = `
        <div style="padding: 10px; border: 1px solid #ccc; margin-top: 0px;">
            <h2>Control Panel</h2>
            <label>Buy Threshold: <input type="number" id="buyThreshold" /></label>
            <label>Sell Threshold: <input type="number" id="sellThreshold" /></label>
            <label>Keep Resources: <input type="number" id="keepResources" /></label>
            <button id="togglePricesUpdate">Toggle Prices Update (OFF)</button>
            <button id="toggleAutoBuy">Toggle Auto Buy (OFF)</button>
            <h3>Market Prices</h3>
            <table border="1" style="margin-top: 10px;">
                <tr>
                    <th>Resource</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Sellable</th>
                    <th>xTimes</th>
                    <th>xTimesTrue</th>
                    <th>isBuyable</th>
                </tr>
                <tr>
                    <td>Wood</td>
                    <td id="woodPriceCell">-</td>
                    <td id="woodStockCell">-</td>
                    <td id="woodSellableCell">-</td>
                    <td id="woodTimesCell">-</td>
                    <td id="woodTimesTrueCell">-</td>
                    <td id="woodBuyableCell">-</td>
                </tr>
                <tr>
                    <td>Stone</td>
                    <td id="stonePriceCell">-</td>
                    <td id="stoneStockCell">-</td>
                    <td id="stoneSellableCell">-</td>
                    <td id="stoneTimesCell">-</td>
                    <td id="stoneTimesTrueCell">-</td>
                    <td id="stoneBuyableCell">-</td>
                </tr>
                <tr>
                    <td>Iron</td>
                    <td id="ironPriceCell">-</td>
                    <td id="ironStockCell">-</td>
                    <td id="ironSellableCell">-</td>
                    <td id="ironTimesCell">-</td>
                    <td id="ironTimesTrueCell">-</td>
                    <td id="ironBuyableCell">-</td>
                </tr>
            </table>
            <h3>Thresholds</h3>
            <table border="1" style="margin-top: 10px;">
                <tr>
                    <th>Type</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Buy Threshold</td>
                    <td id="buyThresholdValue">-</td>
                </tr>
                <tr>
                    <td>Sell Threshold</td>
                    <td id="sellThresholdValue">-</td>
                </tr>
                <tr>
                    <td>Keep Resources</td>
                    <td id="keepResourcesValue">-</td>
                </tr>
                <tr>
                    <td>Available Merchants</td>
                    <td id="availableMerchantsValue">-</td>
                </tr>
            </table>
        </div>
    `
  
    // Inject Control Panel into DOM
    document.querySelector("#content_value").insertAdjacentHTML("beforeend", controlPanelHTML)
  
    let isAutoBuying = false
    let autoBuyInterval
  
    document.getElementById("toggleAutoBuy").addEventListener("click", () => {
      if (isAutoBuying) {
        clearInterval(autoBuyInterval)
        isAutoBuying = false
        document.getElementById("toggleAutoBuy").innerText = "Toggle Auto Buy (OFF)"
      } else {
        autoBuyInterval = setInterval(buyResources, 5000) // runs every 60 seconds
        isAutoBuying = true
        document.getElementById("toggleAutoBuy").innerText = "Toggle Auto Buy (ON)"
      }
    })
  
    // Event Handlers
    let intervalId
    let isUpdating = false
  
    document.getElementById("togglePricesUpdate").addEventListener("click", () => {
      if (isUpdating) {
        clearInterval(intervalId)
        isUpdating = false
        document.getElementById("togglePricesUpdate").innerText = "Toggle Prices Update (OFF)"
      } else {
        intervalId = setInterval(updateResourceDataInTable, 5000)
        isUpdating = true
        document.getElementById("togglePricesUpdate").innerText = "Toggle Prices Update (ON)"
      }
    })
  })()