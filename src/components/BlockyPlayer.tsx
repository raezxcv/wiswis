import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { avatarChoices, type CharacterStyle, type Rsvp } from '../data/birthdayData'
import { BrainrotModel } from './BrainrotModel'

type BlockyPlayerProps = {
  player: Rsvp
  hero?: boolean
  onTripleTap?: (player: Rsvp) => void
}

type PlayerStyle = CSSProperties & {
  '--player-color': string
  '--player-dark': string
  '--player-light': string
}

type CharacterModel = {
  modelUrl: string
  skinUrl: string
  textureUrls: Record<string, string>
}

type DisposableResource = {
  dispose: () => void
  transparent?: boolean
  opacity?: number
  depthWrite?: boolean
  side?: unknown
  needsUpdate?: boolean
}

type SceneChild = {
  castShadow?: boolean
  receiveShadow?: boolean
  frustumCulled?: boolean
  geometry?: DisposableResource
  material?: DisposableResource | DisposableResource[]
  visible?: boolean
}

type LoadedModel = SceneChild & {
  traverse: (callback: (child: SceneChild) => void) => void
  position: { sub: (value: unknown) => void }
  rotation: { y: number }
}

const clampColor = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '')
  const value = Number.parseInt(cleanHex.length === 3 ? cleanHex.replace(/./g, '$&$&') : cleanHex, 16)

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

const isShirtArea = (x: number, y: number) => {
  const inRect = (left: number, top: number, width: number, height: number) =>
    x >= left && x < left + width && y >= top && y < top + height

  return (
    inRect(16, 16, 24, 16) ||
    inRect(40, 16, 16, 16) ||
    inRect(16, 32, 24, 16) ||
    inRect(40, 32, 16, 16) ||
    inRect(32, 48, 16, 16) ||
    inRect(48, 48, 16, 16)
  )
}

const isOriginalShirtPixel = (red: number, green: number, blue: number) =>
  (green > red + 12 && blue > red + 12) || (green > red + 18 && green > blue + 8)

const createShirtTexture = (skinUrl: string, shirtColor: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64

  const context = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace

  const image = new Image()
  image.onload = () => {
    if (!context) return

    const target = hexToRgb(shirtColor)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const skin = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = skin.data

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const index = (y * canvas.width + x) * 4
        const alpha = pixels[index + 3]
        const red = pixels[index]
        const green = pixels[index + 1]
        const blue = pixels[index + 2]

        if (alpha === 0 || !isShirtArea(x, y) || !isOriginalShirtPixel(red, green, blue)) continue

        const shade = Math.max(0.42, Math.min(1.22, (red * 0.299 + green * 0.587 + blue * 0.114) / 145))
        pixels[index] = clampColor(target.r * shade)
        pixels[index + 1] = clampColor(target.g * shade)
        pixels[index + 2] = clampColor(target.b * shade)
      }
    }

    context.putImageData(skin, 0, 0)
    texture.needsUpdate = true
  }
  image.src = skinUrl

  return texture
}

const characterModels: Record<CharacterStyle, CharacterModel> = {
  boy: {
    modelUrl: './assets/minecraft-player/Player.fbx',
    skinUrl: './assets/minecraft-player/steve.png',
    textureUrls: {
      'alex.png': './assets/minecraft-player/alex.png',
      'steve.png': './assets/minecraft-player/steve.png',
    },
  },
  girl: {
    modelUrl: './assets/minecraft-player-slim/PlayerSkinny.fbx',
    skinUrl: './assets/minecraft-player-slim/alex.png',
    textureUrls: {
      'alex.png': './assets/minecraft-player-slim/alex.png',
      'steve.png': './assets/minecraft-player-slim/alex.png',
    },
  },
}





function stableRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return (hash % 100) / 100
}

function MinecraftModel({
  characterStyle,
  hero,
  shirtColor,
}: {
  characterStyle: CharacterStyle
  hero: boolean
  shirtColor: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [renderKey, setRenderKey] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const model = characterModels[characterStyle]
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0.7, 6.2)
    camera.lookAt(0, 0.15, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x5b6f86, 2.2))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
    keyLight.position.set(2, 4, 5)
    scene.add(keyLight)

    const skinTexture = createShirtTexture(model.skinUrl, shirtColor)
    skinTexture.magFilter = THREE.NearestFilter
    skinTexture.minFilter = THREE.NearestFilter
    skinTexture.colorSpace = THREE.SRGBColorSpace

    const skinMaterial = new THREE.MeshBasicMaterial({
      map: skinTexture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    })

    const modelGroup = new THREE.Group()
    scene.add(modelGroup)

    const loadingManager = new THREE.LoadingManager()
    loadingManager.setURLModifier((url: string) => {
      const textureName = url.split(/[\\\/]/).pop()?.toLowerCase()
      return textureName && model.textureUrls[textureName] ? model.textureUrls[textureName] : url
    })

    const loader = new FBXLoader(loadingManager)
    let animationFrame = 0
    let disposed = false
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let startRotationX = 0
    let startRotationY = 0
    let rotationX = 0
    let rotationY = 0
    let returnToFrontAt = 0
    let contextLost = false

    const rebuildAfterContextLoss = () => {
      if (!mount.isConnected || disposed) return
      setRenderKey((key) => key + 1)
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      renderer.domElement.classList.add('is-context-lost')
      cancelAnimationFrame(animationFrame)
      window.setTimeout(rebuildAfterContextLoss, 120)
    }

    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)

    const resize = () => {
      if (!mount.isConnected) return
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault()
      isDragging = true
      dragStartX = event.clientX
      dragStartY = event.clientY
      startRotationX = rotationX
      startRotationY = rotationY
      renderer.domElement.setPointerCapture(event.pointerId)
      returnToFrontAt = performance.now() + 2400
      renderer.domElement.classList.add('is-dragging')
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      event.preventDefault()
      const deltaX = event.clientX - dragStartX
      const deltaY = event.clientY - dragStartY
      rotationY = startRotationY + deltaX * 0.018
      rotationX = Math.max(-0.42, Math.min(0.34, startRotationX + deltaY * 0.01))
      returnToFrontAt = performance.now() + 2400
    }

    const stopDragging = (event: PointerEvent) => {
      if (!isDragging) return
      isDragging = false
      returnToFrontAt = performance.now() + 2400
      renderer.domElement.classList.remove('is-dragging')
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId)
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', stopDragging)
    renderer.domElement.addEventListener('pointercancel', stopDragging)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    loader.load(model.modelUrl, (object: LoadedModel) => {
      if (disposed) return

      object.traverse((child: SceneChild) => {
        child.visible = true
        child.castShadow = false
        child.receiveShadow = false
        child.frustumCulled = false
        child.material = skinMaterial
      })

      const box = new THREE.Box3().setFromObject(object)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxAxis = Math.max(size.x, size.y, size.z) || 1

      object.position.sub(center)
      object.rotation.y = -Math.PI / 2
      modelGroup.scale.setScalar((hero ? 3.2 : 2.85) / maxAxis)
      modelGroup.position.y = hero ? -0.44 : -0.36
      modelGroup.add(object)

      setIsLoaded(true)
    })

    const animate = () => {
      if (contextLost) return
      const now = performance.now()

      if (returnToFrontAt > 0 && now >= returnToFrontAt) {
        if (isDragging) {
          isDragging = false
          renderer.domElement.classList.remove('is-dragging')
        }
        rotationX += (0 - rotationX) * 0.08
        rotationY += (0 - rotationY) * 0.08

        if (Math.abs(rotationX) < 0.006 && Math.abs(rotationY) < 0.006) {
          rotationX = 0
          rotationY = 0
          returnToFrontAt = 0
        }
      }

      modelGroup.rotation.x = rotationX
      modelGroup.rotation.y = rotationY
      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', stopDragging)
      renderer.domElement.removeEventListener('pointercancel', stopDragging)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.dispose()
      renderer.forceContextLoss()
      skinTexture.dispose()
      skinMaterial.dispose()
      scene.traverse((child: SceneChild) => {
        child.geometry?.dispose()
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((material) => material?.dispose())
      })
      renderer.domElement.remove()
    }
  }, [characterStyle, hero, renderKey, shirtColor])

  return (
    <div
      className="minecraft-model"
      ref={mountRef}
      aria-hidden="true"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.45s ease-out',
        width: '100%',
        height: '100%',
      }}
    />
  )
}

export function BlockyPlayer({ player, hero = false, onTripleTap }: BlockyPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const tapCountRef = useRef(0)
  const tapTimeoutRef = useRef<number | null>(null)

  const handleTap = () => {
    if (hero || !onTripleTap) return

    tapCountRef.current += 1
    if (tapCountRef.current >= 3) {
      onTripleTap(player)
      tapCountRef.current = 0
      return
    }

    if (tapTimeoutRef.current) {
      window.clearTimeout(tapTimeoutRef.current)
    }

    tapTimeoutRef.current = window.setTimeout(() => {
      tapCountRef.current = 0
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Only use observer on guest players (Wiswis the hero is always on screen/centered)
    if (hero) {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { rootMargin: '120px' } // Preload when 120px close to viewport
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [hero])

  const color = avatarChoices.find((choice) => choice.id === player.characterColor) ?? avatarChoices[0]
  const characterStyle = player.characterStyle ?? 'boy'
  const normalizedPlayerName = player.name.toUpperCase()

  // Special-name detection (only used when no characterModel override)
  const isTungCharacter = normalizedPlayerName.includes('TUNG')
  const isIvanCharacter = !isTungCharacter && normalizedPlayerName.includes('IVAN')
  const isSpeedCharacter = !isTungCharacter && !isIvanCharacter && normalizedPlayerName.includes('SPEED')
  const isWhiteyCharacter =
    !isTungCharacter && !isIvanCharacter && !isSpeedCharacter && normalizedPlayerName.includes('WHITEY')

  // Stable random alternation for boy / girl characters (consistent per name)
  const rand = stableRandom(player.name)
  const boyUsesRoblox = !hero && characterStyle === 'boy' && rand >= 0.5
  const girlUsesRoblox = !hero && characterStyle === 'girl' && rand >= 0.5

  // CSS class flags
  const playerClassName = [
    hero ? 'blocky-player hero-player' : 'blocky-player',
    characterStyle === 'girl' ? 'girl-player' : 'boy-player',
    isTungCharacter ? 'tung-player' : '',
    isIvanCharacter ? 'buff-steve-player' : '',
    isSpeedCharacter ? 'speed-player' : '',
    isWhiteyCharacter ? 'whitey-player' : '',
    boyUsesRoblox ? 'roblox-noob-player' : '',
    girlUsesRoblox ? 'roblox-girl-player' : '',
    hero ? 'bacon-hair-player' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const style: PlayerStyle = {
    '--player-color': color.hex,
    '--player-dark': color.dark,
    '--player-light': color.light,
    cursor: hero ? 'default' : 'pointer',
  }

  // ─── Model lookup helpers ───────────────────────────────────────────────────
  const baconHair = () => (
    <BrainrotModel
      className="brainrot-3d-model bacon-hair-3d-model"
      modelUrl="./assets/roblox-bacon-hair/scene.gltf"
      baseRotationY={0}
      groundOffset={-0.45}
      scale={2.4}
    />
  )
  const robloxNoob = () => (
    <BrainrotModel
      className="brainrot-3d-model roblox-noob-3d-model"
      modelUrl="./assets/roblox-noob/scene.gltf"
      baseRotationX={0}
      baseRotationY={Math.PI / 2} // Rotate 180°
      groundOffset={-0.38}
      scale={2.3}
    />
  )
  const robloxGirl = () => (
    <BrainrotModel
      className="brainrot-3d-model roblox-girl-3d-model"
      modelUrl="./assets/roblox_r6_girl_with_layered_clothes/scene.gltf"
      baseRotationY={Math.PI}
      groundOffset={-0.46}
      scale={2.3}
    />
  )
  const ispeed = () => (
    <BrainrotModel
      className="brainrot-3d-model speed-3d-model"
      modelUrl="./assets/ishowspeed/scene.gltf"
      baseRotationY={0}
      groundOffset={-0.44}
      scale={2.4}
    />
  )
  const dog = () => (
    <BrainrotModel
      className="brainrot-3d-model dog-3d-model"
      modelUrl="./assets/dog/scene.gltf"
      baseRotationY={0}
      groundOffset={-0.70}
      scale={2.8}
    />
  )
  const tung = () => (
    <BrainrotModel
      className="brainrot-3d-model tung-3d-model"
      modelUrl="./assets/tung-tung-tung-sahur-brainrot-italian/source/tung.glb"
      baseRotationY={-Math.PI / 2}
      groundOffset={-0.28}
      scale={2.35}
    />
  )
  const buffSteve = () => (
    <BrainrotModel
      className="brainrot-3d-model buff-steve-3d-model"
      modelUrl="./assets/buff-steve/source/model.gltf"
      baseRotationY={Math.PI}
      groundOffset={-0.34}
      scale={2.55}
    />
  )
  const minecraftBoy = () => <MinecraftModel characterStyle="boy" hero={false} shirtColor={color.hex} />
  const minecraftGirl = () => <MinecraftModel characterStyle="girl" hero={false} shirtColor={color.hex} />

  // ─── Decide which model to render ──────────────────────────────────────────
  const renderModel = () => {
    // 1. Firebase characterModel field takes priority (manual override)
    if (player.characterModel) {
      switch (player.characterModel) {
        case 'roblox-bacon-hair': return baconHair()
        case 'roblox-noob': return robloxNoob()
        case 'roblox-girl': return robloxGirl()
        case 'ispeed': return ispeed()
        case 'dog': return dog()
        case 'tung': return tung()
        case 'buff-steve': return buffSteve()
        case 'minecraft-girl': return minecraftGirl()
        case 'minecraft-boy': return minecraftBoy()
      }
    }

    // 2. Hero = Wiswis → always roblox-bacon-hair
    if (hero) return baconHair()

    // 3. Special names
    if (isSpeedCharacter) return ispeed()
    if (isWhiteyCharacter) return dog()
    if (isTungCharacter) return tung()
    if (isIvanCharacter) return buffSteve()

    // 4. Girl: randomly minecraft or roblox girl
    if (characterStyle === 'girl') return girlUsesRoblox ? robloxGirl() : minecraftGirl()

    // 5. Boy: randomly minecraft or roblox noob
    return boyUsesRoblox ? robloxNoob() : minecraftBoy()
  }

  return (
    <motion.div
      ref={containerRef}
      className={playerClassName}
      style={style}
      initial={{ opacity: 0, y: 14, scale: hero ? 1 : 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: hero ? 1 : 0.94 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      onClick={handleTap}
    >
      <div className="player-name">{hero ? 'WISWIS' : player.name}</div>
      <div className="player-sprite model-player" aria-label={`${player.name} character`}>
        {isVisible ? renderModel() : <div className="blocky-placeholder-inner" />}
      </div>
    </motion.div>
  )
}

