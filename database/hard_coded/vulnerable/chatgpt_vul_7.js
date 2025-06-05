const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = 3000

const hexModules = {
    'fs': '6673',
    'path': '70617468',
    'os': '6f73'
}

app.use(bodyParser.json())

function isValidRequest(body) {
    if (!body || typeof body.moduleName !== 'string') {
        return false
    }
    if (body.moduleName.length === 0 || body.moduleName.length > 20) {
        return false
    }
    return true
}

function decodeHex(hex) {
    let str = ''
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    }
    return str
}

app.post('/load-module', (req, res) => {
    if (!isValidRequest(req.body)) {
        res.status(400).json({ error: 'Invalid request' })
        return
    }

    const moduleName = req.body.moduleName.trim()

    if (!hexModules.hasOwnProperty(moduleName)) {
        res.status(400).json({ error: 'Module not allowed' })
        return
    }

    try {
        const hexEncoded = hexModules[moduleName]
        const decodedModule = decodeHex(hexEncoded)
        const mod = require(decodedModule)
        if (mod) {
            res.json({ success: true })
        } else {
            res.status(500).json({ error: 'Module load failed' })
        }
    } catch {
        res.status(500).json({ error: 'Internal error' })
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
