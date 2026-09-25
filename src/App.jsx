import { useState } from "react"
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

function App() {
  const [matkaKmh, setMatkaKmh] = useState("")
  const [alkuAika, setAlkuAika] = useState(null)
  const [loppuAika, setLoppuAika] = useState(null)
  const [kulunutAika, setKulunutAika] = useState("")
  const [nopeus, setNopeus] = useState("")

  const [infoAuki, setInfoAuki] = useState(false)

  // NYT TÄYSIN KORJATTU REGEX (Sallii pisteen ja max 1 desimaalin)
  const kasitteleDesimaali = (e) => {
    let arvo = e.target.value
    arvo = arvo.replace(",", ".") // Muuntaa pilkun pisteeksi automaattisesti

    // ^\d*\.?\d{0,1}\$ takaa, että syöte on tyhjä, kokonaisluku tai tasan yksi desimaali
    if (arvo === "" || /^\d*\.?\d{0,1}$/.test(arvo)) {
      setMatkaKmh(arvo)
    }
  }

  const laskeNopeus = (e) => {
    e.preventDefault()
    const kilometrit = parseFloat(matkaKmh)

    if (!alkuAika || !loppuAika || isNaN(kilometrit)) {
      setNopeus("Täytä kaikki kentät")
      return
    }

    let minuutit = loppuAika.diff(alkuAika, "minute")

    if (minuutit < 0) {
      minuutit += 24 * 60
    }

    setKulunutAika(`${minuutit} min`)

    if (minuutit === 0) {
      setNopeus("Aika ei voi olla 0 min")
      return
    }

    const tunnit = minuutit / 60
    const tarkkaKmh = kilometrit / tunnit

    let arvosana = ""
    let naytettavaTulos = ""

    if (tarkkaKmh >= 6) {
      arvosana = "Kiitettävä"
      naytettavaTulos = `${tarkkaKmh.toFixed(1)} km/h ${arvosana}`
    } else {
      const pyoristettyKmh = Math.round(tarkkaKmh)

      if (pyoristettyKmh === 5) {
        arvosana = "HYVÄ"
      } else if (pyoristettyKmh === 4) {
        arvosana = "TYYDYTTÄVÄ"
      } else if (pyoristettyKmh === 3) {
        arvosana = "VÄLTTÄVÄ"
      } else {
        arvosana = "HUONO"
      }

      naytettavaTulos = `${tarkkaKmh.toFixed(1)} km/h → ${arvosana}`
    }

    setNopeus(naytettavaTulos)
  }

  const tyhjennaLomake = () => {
    setMatkaKmh("")
    setAlkuAika(null)
    setLoppuAika(null)
    setKulunutAika("")
    setNopeus("")
  }

  // Avaa infoikkunan ja poistaa fokuksen painikkeesta varoituksen estämiseksi
  const avaaInfo = (e) => {
    if (e.currentTarget) e.currentTarget.blur()
    setInfoAuki(true)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Box
          component="form"
          onSubmit={laskeNopeus}
          sx={{
            p: 4,
            boxShadow: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              mt: 0,
              mb: 4,
            }}
          >
            <Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
              Hakunopeuslaskuri
            </Typography>
            <IconButton
              color="primary"
              onClick={avaaInfo}
              aria-label="näytä raja-arvot"
            >
              <InfoOutlinedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={3}>
            <TextField
              label="Matka (km, esim. 4.5)"
              variant="outlined"
              value={matkaKmh}
              onChange={kasitteleDesimaali}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              fullWidth
              required
            />

            <TimePicker
              label="Alkuaika (hh:mm)"
              ampm={false}
              value={alkuAika}
              onChange={(uusiAika) => setAlkuAika(uusiAika)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />

            <TimePicker
              label="Loppuaika (hh:mm)"
              ampm={false}
              value={loppuAika}
              onChange={(uusiAika) => setLoppuAika(uusiAika)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />

            <TextField
              label="Kulunut aika"
              variant="filled"
              value={kulunutAika}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />

            <TextField
              label="Hakunopeus ja arvosana"
              variant="filled"
              value={nopeus}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
              focused={nopeus !== ""}
            />

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                color="error"
                onClick={tyhjennaLomake}
                fullWidth
              >
                Tyhjennä
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Laske
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>

      <Dialog
        open={infoAuki}
        onClose={() => setInfoAuki(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Hakunopeuden arvostelu
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" component="div">
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
              <li>
                <strong>Kiitettävä:</strong> ≥ 6 km/h (ilman pyöristystä)
              </li>
              <li>
                <strong>Hyvä:</strong> pyöristyy arvoon 5 km/h
              </li>
              <li>
                <strong>Tyydyttävä:</strong> pyöristyy arvoon 4 km/h
              </li>
              <li>
                <strong>Välttävä:</strong> pyöristyy arvoon 3 km/h
              </li>
              <li>
                <strong>Huono:</strong> pyöristyy alle 3 km/h
              </li>
            </ul>
            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", fontStyle: "italic" }}
            >
              * Logiikka pyöristää tuloksen lähimpään kokonaislukuun, ellei
              saavuteta suoraan kiitettävää rajaa.
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInfoAuki(false)}
            color="primary"
            variant="contained"
          >
            Sulje
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default App
