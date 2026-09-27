import { useState, useEffect } from "react"
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  Checkbox,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import InfoIcon from "@mui/icons-material/Info"
import {
  LocalizationProvider,
  TimePicker,
  TimeField,
} from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"

const luoTyhjaRivi = () => ({
  id: Date.now() + Math.random(),
  alkuAika: null,
  loppuAika: null,
  matkaKm: "",
  aikaMin: "",
  ulottuvuusKm: "",
  nopeus: "",
  hakukuvio: "",
  nouto: false,
  pisteet: "",
})

function App() {
  const [rivit, setRivit] = useState(() => {
    const tallennettu = localStorage.getItem("hakulenkit_rivit")
    if (tallennettu) {
      try {
        const parsitut = JSON.parse(tallennettu)
        return parsitut.map((r) => ({
          ...r,
          alkuAika: r.alkuAika ? dayjs(r.alkuAika) : null,
          loppuAika: r.loppuAika ? dayjs(r.loppuAika) : null,
          nouto: r.nouto ?? false,
        }))
      } catch (e) {
        console.error("Virhe ladattaessa rivejä", e)
      }
    }
    return [luoTyhjaRivi()]
  })

  const [infoAuki, setInfoAuki] = useState(false)

  useEffect(() => {
    const tallennettavaData = rivit.map((r) => ({
      ...r,
      alkuAika: r.alkuAika ? r.alkuAika.toISOString() : null,
      loppuAika: r.loppuAika ? r.loppuAika.toISOString() : null,
    }))
    localStorage.setItem("hakulenkit_rivit", JSON.stringify(tallennettavaData))
  }, [rivit])

  // Suodatetaan mukaan vain ne rivit, joilla on syötetty pisteet
  const validitPisteet = rivit
    .map((r) => parseFloat(r.pisteet))
    .filter((p) => !isNaN(p))

  // Lasketaan keskiarvo pyöristettynä lähimpään kokonaislukuun
  const keskiarvo =
    validitPisteet.length > 0
      ? Math.round(
          validitPisteet.reduce((a, b) => a + b, 0) / validitPisteet.length,
        )
      : "-" // Jos riveillä ei ole vielä pisteitä

  const laskePisteEhdotus = (km, ulottuvuus, nopeus) => {
    // Muutetaan syötteet numeroiksi varmuuden vuoksi
    const k = parseFloat(km)
    const u = parseFloat(ulottuvuus)
    const n = parseFloat(nopeus)

    // Jos jokin arvo puuttuu tai ei ole numero, palautetaan tyhjä
    if (isNaN(k) || isNaN(u) || isNaN(n)) {
      return ""
    }

    // Käydään ehdot läpi taulukon mukaisessa järjestyksessä (10 -> 1)
    if (k >= 2 && u >= 0.8) {
      return n >= 6 ? 10 : 9
    }
    if (k >= 1.5 && u >= 0.6) {
      return n >= 4.5 ? 8 : 7
    }
    if (k >= 1 && u >= 0.4) {
      return n >= 3 ? 6 : 5
    }
    if (k >= 0.5 && u >= 0.3) {
      return n >= 1.5 ? 4 : 3
    }
    if (k < 0.5 && u < 0.3) {
      return n >= 1.5 ? 2 : 1
    }

    // Jos arvot sijoittuvat rajatapauksiin (esim. km 0.7 ja ulottuvuus < 0.3), palautetaan oletus
    return 0
  }

  const paivitaArvo = (index, kentta, arvo) => {
    const uudetRivit = [...rivit]
    const rivi = { ...uudetRivit[index], [kentta]: arvo }

    // 1. Pisteiden manuaalisen syötön tarkistus (0–10)
    if (kentta === "pisteet") {
      if (arvo === "") {
        // Sallitaan tyhjennys
      } else {
        const num = Number(arvo)
        if (isNaN(num) || num < 0 || num > 10) {
          return
        }
      }
    }

    // 2. Numerosyötteiden ja pilkkujen korjaus
    if (kentta === "matkaKm" || kentta === "ulottuvuusKm") {
      let korjattu = arvo.replace(",", ".")
      if (korjattu !== "" && !/^\d*\.?\d{0,1}$/.test(korjattu)) {
        return
      }
      rivi[kentta] = korjattu
    }

    // 3. Ajan ja nopeuden laskenta
    const alku = kentta === "alkuAika" ? arvo : rivi.alkuAika
    const loppu = kentta === "loppuAika" ? arvo : rivi.loppuAika
    const matka = parseFloat(rivi.matkaKm)

    let tarkkaKmh = null

    if (alku && loppu) {
      let minuutit = loppu.diff(alku, "minute")
      if (minuutit < 0) minuutit += 24 * 60
      rivi.aikaMin = minuutit.toString()

      if (minuutit > 0 && !isNaN(matka)) {
        const tunnit = minuutit / 60
        tarkkaKmh = matka / tunnit

        let arvosana = ""
        if (tarkkaKmh >= 6.0) arvosana = "kiitettävä"
        else if (tarkkaKmh >= 4.5) arvosana = "hyvä"
        else if (tarkkaKmh >= 3.0) arvosana = "tyydyttävä"
        else if (tarkkaKmh >= 1.5) arvosana = "välttävä"
        else arvosana = "huono"

        rivi.nopeus = `${arvosana}`
      } else {
        rivi.nopeus = ""
      }
    } else {
      rivi.aikaMin = ""
      rivi.nopeus = ""
    }

    // 4. Automaattinen piste-ehdotus
    // Lasketaan automaattisesti vain kun muutetaan matkaa, ulottuvuutta tai aikoja
    if (["matkaKm", "ulottuvuusKm", "alkuAika", "loppuAika"].includes(kentta)) {
      const ehdotetutPisteet = laskePisteEhdotus(
        rivi.matkaKm,
        rivi.ulottuvuusKm,
        tarkkaKmh,
      )

      // Päivitetään pisteet vain, jos laskenta tuotti tuloksen
      if (ehdotetutPisteet !== "") {
        rivi.pisteet = ehdotetutPisteet
      }
    }

    uudetRivit[index] = rivi
    setRivit(uudetRivit)
  }

  const lisaaRivi = () => {
    setRivit([...rivit, luoTyhjaRivi()])
  }

  const poistaRivi = (index) => {
    if (rivit.length === 1) {
      setRivit([luoTyhjaRivi()])
    } else {
      setRivit(rivit.filter((_, i) => i !== index))
    }
  }

  const tyhjennaTaulukko = () => {
    setRivit([luoTyhjaRivi()])
    localStorage.removeItem("hakulenkit_rivit")
  }

  const syotteentyyli = {
    fontSize: "1rem",
    textAlign: "center",
  }

  const laskettuKenttaTyyli = {
    bgcolor: "#f0f0f0",
    borderRadius: "2px",
    px: 0.5,
    py: 0.2,
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth={false} disableGutters sx={{ p: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "center", mb: 1 }}
        >
          <Typography
            variant="h6"
            component="h1"
            sx={{ fontWeight: "bold", color: "white" }}
          >
            Hakulenkit
          </Typography>
          <IconButton
            color="primary"
            onClick={() => setInfoAuki(true)}
            size="small"
          >
            <InfoIcon
              sx={{
                color: "#ffffff",
                ml: 6,
              }}
            />
          </IconButton>
        </Stack>

        <TableContainer
          component={Paper}
          sx={{
            border: "1px solid #000",
            borderRadius: 0,
            overflowX: "auto",
            maxHeight: 260,
          }}
        >
          <Table
            size="small"
            stickyHeader // Pitää otsikkorivin paikoillaan vierittäessä
            sx={{
              tableLayout: "fixed",
              minWidth: 550,
              "& td, & th": {
                border: "1px solid #000",
                p: "2px 2px",
                fontSize: "0.7rem",
                overflow: "hidden",
              },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  "& th": { bgcolor: "#f5f5f5" }, // Varmistaa taustan väri sticky-tilassa
                }}
              >
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 40 }}
                >
                  Alkoi
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 40 }}
                >
                  Päättyi
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 30 }}
                >
                  km
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 30, bgcolor: "#e0e0e0" }}
                >
                  min
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 45 }}
                >
                  Ulottuvuus km
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 70, bgcolor: "#e0e0e0" }}
                >
                  Nopeus
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 70 }}
                >
                  Hakukuvio
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 40 }}
                >
                  Nouto
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 30 }}
                >
                  Pisteet
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    width: 30,
                    fontSize: "1rem !important",
                  }}
                >
                  {keskiarvo}
                </TableCell>
                {/* <TableCell align="center" sx={{ width: 30 }}></TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {rivit.map((rivi, index) => (
                <TableRow key={rivi.id}>
                  {/* Kapea Alkaa-sarake */}
                  <TableCell align="center">
                    <TimeField
                      format="HH:mm"
                      value={rivi.alkuAika}
                      onChange={(uusi) => paivitaArvo(index, "alkuAika", uusi)}
                      variant="standard"
                      slotProps={{
                        input: { disableUnderline: true },
                      }}
                    />
                  </TableCell>
                  {/* Kapea Päättyy-sarake */}
                  <TableCell align="center">
                    <TimeField
                      format="HH:mm"
                      value={rivi.loppuAika}
                      onChange={(uusi) => paivitaArvo(index, "loppuAika", uusi)}
                      variant="standard"
                      slotProps={{
                        input: { disableUnderline: true },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      variant="standard"
                      value={rivi.matkaKm}
                      onChange={(e) =>
                        paivitaArvo(index, "matkaKm", e.target.value)
                      }
                      slotProps={{
                        htmlInput: {
                          inputMode: "decimal",
                          style: syotteentyyli,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f9f9f9" }}>
                    <TextField
                      variant="standard"
                      value={rivi.aikaMin}
                      slotProps={{
                        input: {
                          readOnly: true,
                          disableUnderline: true,
                          style: syotteentyyli,
                        },
                      }}
                      sx={laskettuKenttaTyyli}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      variant="standard"
                      value={rivi.ulottuvuusKm}
                      onChange={(e) =>
                        paivitaArvo(index, "ulottuvuusKm", e.target.value)
                      }
                      slotProps={{
                        htmlInput: {
                          inputMode: "decimal",
                          style: syotteentyyli,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f9f9f9" }}>
                    <TextField
                      variant="standard"
                      value={rivi.nopeus}
                      slotProps={{
                        input: {
                          readOnly: true,
                          disableUnderline: true,
                          style: syotteentyyli,
                        },
                      }}
                      sx={laskettuKenttaTyyli}
                    />
                  </TableCell>
                  {/* Korjattu Hakukuvio-valikko autocompletella */}
                  <TableCell align="center">
                    <Autocomplete
                      freeSolo
                      options={["pisto", "lenkki"]}
                      value={rivi.hakukuvio}
                      onInputChange={(_, uusiArvo) =>
                        paivitaArvo(index, "hakukuvio", uusiArvo || "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          size="small"
                          sx={laskettuKenttaTyyli}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={rivi.nouto}
                      onChange={(e) =>
                        paivitaArvo(index, "nouto", e.target.checked)
                      }
                      color="primary"
                      size="small"
                      sx={{ p: 0 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      variant="standard"
                      value={rivi.pisteet}
                      onChange={(e) =>
                        paivitaArvo(index, "pisteet", e.target.value)
                      }
                      slotProps={{
                        htmlInput: { style: syotteentyyli },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => poistaRivi(index)}
                      sx={{ p: 0 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 1.5, justifyContent: "space-between" }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={lisaaRivi}
          >
            Lisää rivi
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={tyhjennaTaulukko}
          >
            Tyhjennä
          </Button>
        </Stack>
      </Container>

      <Dialog
        open={infoAuki}
        onClose={() => setInfoAuki(false)}
        maxWidth="xs"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Arvostelutaulukko</DialogTitle>
        <DialogContent dividers>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>
              <strong>Kiitettävä:</strong> vähintään 6.0 km/h
            </li>
            <li>
              <strong>Hyvä:</strong> vähintään 4.5 km/h
            </li>
            <li>
              <strong>Tyydyttävä:</strong> vähintään 3.0 km/h
            </li>
            <li>
              <strong>Välttävä:</strong> vähintään 1.5 km/h
            </li>
            <li>
              <strong>Huono:</strong> alle 1.5 km/h
            </li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoAuki(false)} variant="contained">
            Sulje
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default App
