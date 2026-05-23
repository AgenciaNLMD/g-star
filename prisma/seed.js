const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const categorias = [
  {
    slug: 'alumbrado',
    nombre: 'Alumbrado Público',
    descripcion: 'Luminarias apagadas o fundidas, cables colgantes, postes dañados, zonas sin iluminación en calles o espacios públicos.',
    palabrasClave: ['luz', 'luminaria', 'farola', 'alumbrado', 'poste', 'cable', 'oscuro', 'iluminación', 'foco', 'lámpara'],
    areaMunicipal: 'Obras y Servicios Públicos',
    prioridadDefault: 'media',
    color: '#f59e0b',
    icono: 'lightbulb',
    orden: 1,
  },
  {
    slug: 'limpieza',
    nombre: 'Limpieza Urbana',
    descripcion: 'Basurales en vía pública, microbasurales, muebles o escombros abandonados, terrenos con residuos acumulados, falta de limpieza en espacios públicos.',
    palabrasClave: ['basura', 'basural', 'residuos', 'escombros', 'muebles', 'suciedad', 'baldío', 'desechos', 'basurero', 'mugre'],
    areaMunicipal: 'Higiene Urbana',
    prioridadDefault: 'media',
    color: '#84cc16',
    icono: 'trash-2',
    orden: 2,
  },
  {
    slug: 'vialidad',
    nombre: 'Calles y Veredas',
    descripcion: 'Baches, asfalto roto o levantado, veredas deterioradas, cordones dañados, calles de tierra intransitables, pozos en la calzada.',
    palabrasClave: ['bache', 'asfalto', 'vereda', 'calle', 'pozo', 'roto', 'cordón', 'tierra', 'pavimento', 'calzada'],
    areaMunicipal: 'Obras Públicas Viales',
    prioridadDefault: 'media',
    color: '#71717a',
    icono: 'road',
    orden: 3,
  },
  {
    slug: 'arbolado',
    nombre: 'Arbolado y Poda',
    descripcion: 'Árboles que necesitan poda, ramas caídas sobre la vía pública o cables, árboles secos o peligrosos, raíces que levantan veredas o dañan cañerías.',
    palabrasClave: ['árbol', 'poda', 'rama', 'raíz', 'caído', 'seco', 'cortar', 'árbol peligroso', 'verde', 'tronco'],
    areaMunicipal: 'Espacios Verdes y Arbolado',
    prioridadDefault: 'baja',
    color: '#15803d',
    icono: 'tree-pine',
    orden: 4,
  },
  {
    slug: 'cloaca',
    nombre: 'Cloacas y Desagüe Cloacal',
    descripcion: 'Pérdidas cloacales en la vía pública, tapones, aguas servidas en superficie, caños rotos, pozos ciegos desbordando, olores nauseabundos por cloaca.',
    palabrasClave: ['cloaca', 'cloacal', 'caño', 'aguas servidas', 'tapón', 'desborde', 'pérdida', 'pozo ciego', 'desagüe', 'olor cloaca'],
    areaMunicipal: 'Obras Sanitarias',
    prioridadDefault: 'alta',
    color: '#92400e',
    icono: 'circle-dot',
    orden: 5,
  },
  {
    slug: 'agua_potable',
    nombre: 'Agua Potable',
    descripcion: 'Cortes de suministro de agua, baja presión, pérdidas visibles en la red, agua con mal color, olor o sabor, caños de agua rotos en la vía pública.',
    palabrasClave: ['agua', 'agua potable', 'corte de agua', 'sin agua', 'pérdida de agua', 'presión', 'caño agua', 'turbia', 'olor agua'],
    areaMunicipal: 'Obras Sanitarias',
    prioridadDefault: 'alta',
    color: '#0891b2',
    icono: 'droplet',
    orden: 6,
  },
  {
    slug: 'pluvial',
    nombre: 'Pluviales e Inundaciones',
    descripcion: 'Bocas de tormenta tapadas, acumulación de agua de lluvia en calles o terrenos, zonas propensas a inundarse, alcantarillas obstruidas, zanjas pluviales colapsadas.',
    palabrasClave: ['inundación', 'lluvia', 'agua de lluvia', 'boca de tormenta', 'alcantarilla', 'pluvial', 'anegado', 'zanja', 'desagüe pluvial'],
    areaMunicipal: 'Obras Hidráulicas',
    prioridadDefault: 'alta',
    color: '#0ea5e9',
    icono: 'cloud-rain-wind',
    orden: 7,
  },
  {
    slug: 'seguridad',
    nombre: 'Seguridad Ciudadana',
    descripcion: 'Situaciones de inseguridad, robos, vandalismo, pedidos de mayor presencia policial o iluminación por seguridad, personas en situación de calle conflictiva.',
    palabrasClave: ['robo', 'inseguridad', 'vandalismo', 'peligro', 'policía', 'delito', 'amenaza', 'riesgo', 'seguridad', 'violencia'],
    areaMunicipal: 'Seguridad Ciudadana',
    prioridadDefault: 'alta',
    color: '#dc2626',
    icono: 'shield',
    orden: 8,
  },
  {
    slug: 'senalizacion',
    nombre: 'Señalización Vial',
    descripcion: 'Semáforos en mal estado o apagados, carteles viales caídos o faltantes, demarcación borrada en calzada, lomos de burro dañados, falta de señales de tránsito.',
    palabrasClave: ['semáforo', 'cartel', 'señal', 'señalización', 'demarcación', 'lomo de burro', 'tránsito', 'vial', 'stop', 'paso peatonal'],
    areaMunicipal: 'Tránsito y Vialidad',
    prioridadDefault: 'media',
    color: '#f97316',
    icono: 'traffic-cone',
    orden: 9,
  },
  {
    slug: 'espacios_verdes',
    nombre: 'Espacios Verdes y Plazas',
    descripcion: 'Plazas descuidadas o sucias, juegos rotos o peligrosos, pasto sin cortar en parques, falta de mantenimiento de áreas recreativas, bancos o luminarias rotas en plazas.',
    palabrasClave: ['plaza', 'parque', 'juegos', 'pasto', 'verde', 'banco', 'hamaca', 'tobogán', 'espacio público', 'recreación'],
    areaMunicipal: 'Espacios Verdes y Arbolado',
    prioridadDefault: 'baja',
    color: '#22c55e',
    icono: 'tent-tree',
    orden: 10,
  },
  {
    slug: 'animales',
    nombre: 'Animales y Zoonosis',
    descripcion: 'Animales sueltos o callejeros, perros agresivos, plagas de roedores o insectos, palomas en edificios públicos, animales muertos en la vía pública.',
    palabrasClave: ['perro', 'animal', 'rata', 'roedor', 'plaga', 'paloma', 'gato', 'murciélago', 'insectos', 'zoonosis', 'animal muerto'],
    areaMunicipal: 'Ambiente y Zoonosis',
    prioridadDefault: 'media',
    color: '#a855f7',
    icono: 'paw-print',
    orden: 11,
  },
  {
    slug: 'contaminacion',
    nombre: 'Ruidos y Contaminación',
    descripcion: 'Ruidos molestos de vecinos o comercios, humo, malos olores de origen doméstico o comercial, quema de residuos, contaminación sonora o visual en el barrio.',
    palabrasClave: ['ruido', 'música alta', 'olor', 'humo', 'quema', 'contaminación', 'molestia', 'vecino ruidoso', 'local', 'sonido'],
    areaMunicipal: 'Ambiente y Bromatología',
    prioridadDefault: 'media',
    color: '#78716c',
    icono: 'wind',
    orden: 12,
  },
  {
    slug: 'obras',
    nombre: 'Obras Públicas',
    descripcion: 'Obras municipales abandonadas o sin terminar, cortes de calle sin señalizar correctamente, zanjeos no reparados, materiales de obra abandonados en la vía pública.',
    palabrasClave: ['obra', 'zanjeo', 'corte de calle', 'construcción', 'sin terminar', 'abandonada', 'materiales', 'obstrucción', 'obran municipales'],
    areaMunicipal: 'Obras Públicas',
    prioridadDefault: 'media',
    color: '#ea580c',
    icono: 'hard-hat',
    orden: 13,
  },
  {
    slug: 'vivienda',
    nombre: 'Vivienda e Infraestructura',
    descripcion: 'Construcciones ilegales, usurpaciones de terrenos, casas o estructuras en riesgo de derrumbe, conexiones ilegales a la red eléctrica o de agua.',
    palabrasClave: ['usurpación', 'construcción ilegal', 'derrumbe', 'conexión ilegal', 'vivienda', 'asentamiento', 'toma', 'peligro derrumbe'],
    areaMunicipal: 'Hábitat y Vivienda',
    prioridadDefault: 'alta',
    color: '#7c3aed',
    icono: 'home',
    orden: 14,
  },
  {
    slug: 'infraestructura_publica',
    nombre: 'Infraestructura Pública',
    descripcion: 'Edificios públicos en mal estado de mantenimiento: colegios, hospitales, centros de salud, delegaciones municipales, polideportivos. Baños rotos, techos con filtraciones, ventanas dañadas, rampas de acceso inutilizables, mobiliario escolar o sanitario deteriorado.',
    palabrasClave: ['colegio', 'escuela', 'hospital', 'salud', 'centro de salud', 'delegación', 'edificio público', 'baño roto', 'techo', 'filtracion', 'rampa', 'accesibilidad'],
    areaMunicipal: 'Mantenimiento de Edificios Públicos',
    prioridadDefault: 'alta',
    color: '#475569',
    icono: 'building-2',
    orden: 15,
  },
  {
    slug: 'medio_ambiente',
    nombre: 'Medio Ambiente e Industria',
    descripcion: 'Denuncias formales contra industrias o grandes comercios: efluentes vertidos, olores industriales, ruidos de maquinaria, vuelco de residuos peligrosos, humo de fábricas, contaminación de arroyos, napas o suelo por actividad industrial.',
    palabrasClave: ['fábrica', 'industria', 'efluente', 'arroyo', 'contaminación industrial', 'residuos peligrosos', 'humo fábrica', 'químicos', 'denuncia ambiental', 'OPDS'],
    areaMunicipal: 'Medio Ambiente',
    prioridadDefault: 'alta',
    color: '#059669',
    icono: 'factory',
    orden: 16,
  },
  {
    slug: 'otros',
    nombre: 'Otros',
    descripcion: 'Reclamos que no encajan en ninguna de las categorías anteriores. Requiere revisión y reclasificación manual por parte del personal municipal.',
    palabrasClave: [],
    areaMunicipal: 'General',
    prioridadDefault: 'baja',
    color: '#6b7280',
    icono: 'circle-help',
    orden: 17,
  },
]

// ─── Agente Reclamos ──────────────────────────────────────────────────────────

const agenteReclamos = {
  nombre: 'Reclamos Municipales',
  proveedor: 'anthropic',
  modelo: null,
  esOrquestador: false,
  activo: true,
  herramientas: ['obtener_categorias', 'crear_reclamo', 'transferir_a_area', 'transferir_a_humano', 'sin_cobertura', 'fin_conversacion'],
  keywords: 'reclamo, queja, problema, denuncia, bache, basura, luz, alumbrado, agua, cloaca, poda, árbol, seguridad, vereda, semáforo, ruido, animales, obras, plaza, rotura, perdida, inundacion, olor, murciélago, rata, pozo, arreglar, roto, falta, ayuda, denunciar, municipio, calle',
  conocimiento: null,
  sistemaPrompt: `Sos el agente de Reclamos del municipio. Tu único trabajo es atender y registrar reclamos, quejas y denuncias de los vecinos sobre problemas en el espacio público o en los servicios municipales.

## Tu flujo de trabajo

1. Saludá y preguntá qué problema tiene el vecino.
2. Escuchá la descripción del problema.
3. Si no mencionó la dirección exacta donde ocurre, pedísela.
4. Llamá a "obtener_categorias" para ver las categorías disponibles y elegí la que mejor encaje.
5. Confirmá brevemente los datos al vecino antes de registrar.
6. Llamá a "crear_reclamo" con todos los datos completos.
7. Avisale el número de reclamo y que lo van a atender a la brevedad.

## Reglas importantes

- Siempre pedí dirección o referencia de lugar (aunque sea "cerca de la plaza de Canning").
- No registres el reclamo sin al menos asunto, descripción y dirección.
- Usá siempre "obtener_categorias" antes de "crear_reclamo" para elegir bien el slug.
- Si el vecino quiere hacer un trámite o turno (no un reclamo), derivalo con "transferir_a_area".
- Sé empático, breve y claro. No uses tecnicismos.
- Hablá siempre en español rioplatense (vos, che, etc.).`,
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding categorias_reclamo...')

  for (const cat of categorias) {
    await prisma.categoriaReclamo.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    console.log(`  ✓ ${cat.nombre}`)
  }

  console.log(`\nListo — ${categorias.length} categorías cargadas.`)

  console.log('\nSeeding flow_agentes...')
  await prisma.flowAgente.upsert({
    where:  { nombre: agenteReclamos.nombre },
    update: agenteReclamos,
    create: agenteReclamos,
  })
  console.log(`  ✓ ${agenteReclamos.nombre}`)
  console.log('\nListo — agentes cargados.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
