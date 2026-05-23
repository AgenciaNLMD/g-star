import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

const GEOJSON_ROOT = path.join(process.cwd(), "geojson", "geojson")

const LOCALIDADES_FILES = [
  { nombre: "Aeropuerto", file: "localidad/aeropuerto.geojson" },
  { nombre: "Canning",    file: "localidad/canning.geojson"   },
  { nombre: "Ezeiza",     file: "localidad/ezeiza.geojson"    },
  { nombre: "La Unión",   file: "localidad/launion.geojson"   },
  { nombre: "Spegazzini", file: "localidad/spegazzini.geojson"},
  { nombre: "Suárez",     file: "localidad/suarez.geojson"    },
]

const BARRIOS_POR_LOCALIDAD = {
  "Aeropuerto": [
    { nombre: "Barrios 1 y 2",       file: "barrio/aeropuerto/barrios1y2.geojson" },
  ],
  "Canning": [
    { nombre: "Canning Centro",       file: "barrio/canning/canningcentro.geojson" },
    { nombre: "Los Caudillos",        file: "barrio/canning/caudillos.geojson"     },
    { nombre: "Country del Bosque",   file: "barrio/canning/delbosque.geojson"     },
    { nombre: "Country Don Joaquín",  file: "barrio/canning/donjoaquin.geojson"    },
    { nombre: "Polo Industrial",      file: "barrio/canning/industrial.geojson"    },
  ],
  "Ezeiza": [
    { nombre: "Allá en el Sur",       file: "barrio/ezeiza/allaenelsur.geojson"        },
    { nombre: "Ate y El Tala",        file: "barrio/ezeiza/ateytala.geojson"           },
    { nombre: "Centro Norte",         file: "barrio/ezeiza/ezeizacentronorte.geojson"  },
    { nombre: "Centro Sur",           file: "barrio/ezeiza/ezeizacentrosur.geojson"    },
    { nombre: "Villa Guillermina",    file: "barrio/ezeiza/guillermina.geojson"        },
    { nombre: "Lamadrid",             file: "barrio/ezeiza/lamadrid.geojson"           },
    { nombre: "O'Donne",              file: "barrio/ezeiza/odone.geojson"              },
    { nombre: "Reina Elena",          file: "barrio/ezeiza/reinaelena.geojson"         },
    { nombre: "El Vecinal",           file: "barrio/ezeiza/vecinal.geojson"            },
  ],
  "La Unión": [
    { nombre: "5ta Avenida",          file: "barrio/launion/5tav.geojson"     },
    { nombre: "El Paso",              file: "barrio/launion/elpaso.geojson"   },
    { nombre: "Barrio Hospital",      file: "barrio/launion/hospital.geojson" },
    { nombre: "Villa Links",          file: "barrio/launion/links.geojson"    },
    { nombre: "Sol de Oro",           file: "barrio/launion/soldeoro.geojson" },
    { nombre: "El Trébol",            file: "barrio/launion/trebol.geojson"   },
    { nombre: "Unión Ferroviaria",    file: "barrio/launion/union.geojson"    },
    { nombre: "Villa Golf",           file: "barrio/launion/vgolf.geojson"    },
  ],
  "Spegazzini": [
    { nombre: "Tres Américas",        file: "barrio/spegazzini/americas.geojson"   },
    { nombre: "Barrio Del Plata",     file: "barrio/spegazzini/delplata.geojson"   },
    { nombre: "El Porvenir",          file: "barrio/spegazzini/elporvenir.geojson" },
    { nombre: "General Güemes",       file: "barrio/spegazzini/gralguemes.geojson" },
    { nombre: "Barrio La Flecha",     file: "barrio/spegazzini/laflecha.geojson"   },
    { nombre: "Barrio Las Lomas",     file: "barrio/spegazzini/laslomas.geojson"   },
    { nombre: "Los Guindos",          file: "barrio/spegazzini/losguindos.geojson" },
    { nombre: "Monte Rosa",           file: "barrio/spegazzini/mterosa.geojson"    },
    { nombre: "San Javier",           file: "barrio/spegazzini/sanjavier.geojson"  },
    { nombre: "San José",             file: "barrio/spegazzini/sanjose.geojson"    },
    { nombre: "Spegazzini",           file: "barrio/spegazzini/spega.geojson"      },
  ],
  "Suárez": [
    { nombre: "Altos de Suárez",      file: "barrio/suarez/altosdesuarez.geojson"  },
    { nombre: "Barrios Country",      file: "barrio/suarez/barrioscountry.geojson" },
    { nombre: "Coparque",             file: "barrio/suarez/coparque.geojson"       },
    { nombre: "El Deslinde",          file: "barrio/suarez/eldeslinde.geojson"     },
    { nombre: "Fincas del Alba",      file: "barrio/suarez/fincasdelalba.geojson"  },
    { nombre: "Howard Johnson",       file: "barrio/suarez/howard.geojson"         },
    { nombre: "Lares",                file: "barrio/suarez/lares.geojson"          },
    { nombre: "Las Victorias",        file: "barrio/suarez/lasvictorias.geojson"   },
    { nombre: "Luján I y II",         file: "barrio/suarez/lujan.geojson"          },
    { nombre: "La Providencia",       file: "barrio/suarez/providencia.geojson"    },
    { nombre: "Santa Marta",          file: "barrio/suarez/stamarta.geojson"       },
    { nombre: "Tristán Suárez",       file: "barrio/suarez/suarez.geojson"         },
    { nombre: "Terralagos",           file: "barrio/suarez/terralagos.geojson"     },
    { nombre: "Vista Alegre",         file: "barrio/suarez/vistaalegre.geojson"    },
    { nombre: "Vista Linda",          file: "barrio/suarez/vistalinda.geojson"     },
  ],
}

function readGeoJSON(relPath, nombre) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(GEOJSON_ROOT, relPath), "utf8"))
    if (nombre) {
      const features = raw.features ?? [raw]
      features.forEach((f) => { if (f.properties) f.properties.nombre = nombre })
    }
    return raw
  } catch {
    return null
  }
}

export async function GET(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const solo = searchParams.get("solo")

  if (solo === "capas") {
    const partido     = readGeoJSON("partido/ezeiza.geojson")
    const localidades = LOCALIDADES_FILES.map(({ nombre, file }) => readGeoJSON(file, nombre)).filter(Boolean)
    return NextResponse.json({ partido, localidades })
  }

  if (solo === "categorias") {
    const categorias = await prisma.categoriaReclamo.findMany({
      select: { slug: true, nombre: true, color: true, icono: true, orden: true },
      orderBy: { orden: "asc" },
    })
    return NextResponse.json({ categorias })
  }

  if (solo === "barrios") {
    const loc     = searchParams.get("loc") ?? ""
    const barrios = BARRIOS_POR_LOCALIDAD[loc] ?? []
    const features = barrios
      .map(({ nombre, file }) => {
        const geojson = readGeoJSON(file, nombre)
        if (!geojson) return null
        return geojson.features ?? [geojson]
      })
      .filter(Boolean)
      .flat()
    return NextResponse.json({ type: "FeatureCollection", features })
  }

  const localidad  = searchParams.get("localidad")  || undefined
  const fechaDesde = searchParams.get("fechaDesde")
  const fechaHasta = searchParams.get("fechaHasta")

  const reclamos = await prisma.reclamo.findMany({
    where: {
      NOT: { lat: null, lng: null },
      ...(localidad && { localidad }),
      ...((fechaDesde || fechaHasta) && {
        createdAt: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          ...(fechaHasta && { lte: new Date(fechaHasta + "T23:59:59") }),
        },
      }),
    },
    select: {
      id: true, numero: true, asunto: true, texto: true,
      estado: true, etiqueta: true, barrio: true, localidad: true,
      direccion: true, lat: true, lng: true,
      contactoNombre: true, contactoTelefono: true, createdAt: true,
      categoria: { select: { slug: true, nombre: true, color: true, icono: true } },
      usuario:   { select: { nombre: true } },
      adjuntos:  { select: { url: true, nombre: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ reclamos })
}
