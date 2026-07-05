import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import boyModelUrl from '../assets/minecraft-player/Player.fbx?url'
import boyAlexTextureUrl from '../assets/minecraft-player/alex.png?url'
import boySteveTextureUrl from '../assets/minecraft-player/steve.png?url'
import girlModelUrl from '../assets/minecraft-player-slim/PlayerSkinny.fbx?url'
import girlAlexTextureUrl from '../assets/minecraft-player-slim/alex.png?url'
import { avatarChoices, type CharacterStyle, type Rsvp } from '../data/birthdayData'

type BlockyPlayerProps = {
  player: Rsvp
  hero?: boolean
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
    modelUrl: boyModelUrl,
    skinUrl: boySteveTextureUrl,
    textureUrls: {
      'alex.png': boyAlexTextureUrl,
      'steve.png': boySteveTextureUrl,
    },
  },
  girl: {
    modelUrl: girlModelUrl,
    skinUrl: girlAlexTextureUrl,
    textureUrls: {
      'alex.png': girlAlexTextureUrl,
      'steve.png': girlAlexTextureUrl,
    },
  },
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
      const textureName = url.split(/[\\/]/).pop()?.toLowerCase()
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
      modelGroup.position.y = hero ? -0.62 : -0.55
      modelGroup.add(object)
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

  return <div className="minecraft-model" ref={mountRef} aria-hidden="true" />
}

export function BlockyPlayer({ player, hero = false }: BlockyPlayerProps) {
  const color = avatarChoices.find((choice) => choice.id === player.characterColor) ?? avatarChoices[0]
  const characterStyle = player.characterStyle ?? 'boy'
  const playerClassName = `${hero ? 'blocky-player hero-player' : 'blocky-player'} ${
    characterStyle === 'girl' ? 'girl-player' : 'boy-player'
  }`
  const style: PlayerStyle = {
    '--player-color': color.hex,
    '--player-dark': color.dark,
    '--player-light': color.light,
  }

  return (
    <motion.div
      className={playerClassName}
      style={style}
      initial={{ opacity: 0, y: 14, scale: hero ? 1 : 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <div className="player-name">{hero ? 'WISWIS' : player.name}</div>
      <div className="player-sprite model-player" aria-label={`${player.name} character`}>
        <MinecraftModel characterStyle={characterStyle} hero={hero} shirtColor={color.hex} />
      </div>
    </motion.div>
  )
}