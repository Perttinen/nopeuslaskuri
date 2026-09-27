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

  const paivitaArvo = (index, kentta, arvo) => {
    const uudetRivit = [...rivit]
    const rivi = { ...uudetRivit[index], [kentta]: arvo }

    if (kentta === "matkaKm" || kentta === "ulottuvuusKm") {
      let korjattu = arvo.replace(",", ".")
      if (korjattu !== "" && !/^\d*\.?\d{0,1}$/.test(korjattu)) {
        return
      }
      rivi[kentta] = korjattu
    }

    const alku = kentta === "alkuAika" ? arvo : rivi.alkuAika
    const loppu = kentta === "loppuAika" ? arvo : rivi.loppuAika
    const matka = parseFloat(rivi.matkaKm)

    if (alku && loppu) {
      let minuutit = loppu.diff(alku, "minute")
      if (minuutit < 0) minuutit += 24 * 60
      rivi.aikaMin = minuutit.toString()

      if (minuutit > 0 && !isNaN(matka)) {
        const tunnit = minuutit / 60
        const tarkkaKmh = matka / tunnit

        let arvosana = ""
        if (tarkkaKmh >= 6.0) arvosana = "kiitettävä"
        else if (tarkkaKmh >= 4.5) arvosana = "hyvä"
        else if (tarkkaKmh >= 3.0) arvosana = "tyydyttävä"
        else if (tarkkaKmh >= 1.5) arvosana = "välttävä"
        else arvosana = "huono"

        rivi.nopeus = `${tarkkaKmh.toFixed(1)} ${arvosana}`
      } else {
        rivi.nopeus = ""
      }
    } else {
      rivi.aikaMin = ""
      rivi.nopeus = ""
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
    fontSize: "0.75rem",
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
          <Typography variant="h6" component="h1" sx={{ fontWeight: "bold" }}>
            Hakulenkit
          </Typography>
          <IconButton
            color="primary"
            onClick={() => setInfoAuki(true)}
            size="small"
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <TableContainer
          component={Paper}
          sx={{ border: "1px solid #000", borderRadius: 0, overflowX: "auto" }}
        >
          <Table
            size="small"
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
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 40 }}
                >
                  Alkaa
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: 40 }}
                >
                  Päättyy
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
                  sx={{ fontWeight: "bold", width: 90 }}
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
                <TableCell align="center" sx={{ width: 30 }}></TableCell>
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
                          sx={{
                            "& .MuiInputBase-input": {
                              fontSize: "0.75rem !important",
                              textAlign: "center !important",
                            },
                          }}
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
            variant="outlined"
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
