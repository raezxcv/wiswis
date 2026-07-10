import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import brainrotModelUrl from '../assets/tung-tung-tung-sahur-brainrot-italian/source/tripo_pbr_model_09e9005a-9efe-43d0-b58a-f9916d7260a5.glb?url'

type BrainrotModelProps = {
  className?: string
  modelUrl?: string
  /** Map of bare filename (e.g. "foo.png") → Vite-bundled URL for texture remapping */
  textureUrls?: Record<string, string>
  baseRotationY?: number
  scale?: number
  groundOffset?: number
  float?: boolean
}

type SceneChild = {
  castShadow?: boolean
  receiveShadow?: boolean
  frustumCulled?: boolean
  geometry?: { dispose: () => void }
  material?: { dispose: () => void } | { dispose: () => void }[]
}

type LoadedModel = {
  scene: InstanceType<typeof THREE.Group>
}

export function BrainrotModel({
  className = 'brainrot-3d-model',
  modelUrl = brainrotModelUrl,
  textureUrls,
  baseRotationY = -Math.PI / 2,
  scale = 2.2,
  groundOffset = -0.34,
  float = false,
}: BrainrotModelProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [renderKey, setRenderKey] = useState(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(0, 0, 5.5)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.8))
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5)
    dirLight1.position.set(2, 4, 4)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffeedd, 1.5)
    dirLight2.position.set(-2, -2, 2)
    scene.add(dirLight2)

    const modelGroup = new THREE.Group()
    scene.add(modelGroup)

    const loadingManager = textureUrls
      ? new THREE.LoadingManager(undefined, undefined, undefined)
      : undefined

    if (loadingManager && textureUrls) {
      loadingManager.setURLModifier((url: string) => {
        const filename = url.split(/[\\/]/).pop() ?? ''
        return textureUrls[filename] ?? url
      })
    }

    const loader = new GLTFLoader(loadingManager)
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
      rotationY = startRotationY + deltaX * 0.015
      rotationX = Math.max(-0.6, Math.min(0.6, startRotationX + deltaY * 0.01))
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

    loader.load(modelUrl, (gltf: LoadedModel) => {
      if (disposed) return

      const object = gltf.scene
      object.traverse((child: unknown) => {
        const sceneChild = child as SceneChild
        sceneChild.castShadow = true
        sceneChild.receiveShadow = true
        sceneChild.frustumCulled = false
      })

      const box = new THREE.Box3().setFromObject(object)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxAxis = Math.max(size.x, size.y, size.z) || 1

      object.position.sub(center)
      modelGroup.scale.setScalar(scale / maxAxis)
      modelGroup.position.y = groundOffset
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
        rotationX += (0 - rotationX) * 0.05
        rotationY += (0 - rotationY) * 0.05

        if (Math.abs(rotationX) < 0.01 && Math.abs(rotationY) < 0.01) {
          rotationX = 0
          rotationY = 0
          returnToFrontAt = 0
        }
      }

      modelGroup.position.y = float && !isDragging && returnToFrontAt === 0
        ? groundOffset + Math.sin(now * 0.0018) * 0.05
        : groundOffset
      modelGroup.rotation.x = rotationX
      modelGroup.rotation.y = baseRotationY + rotationY
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
      scene.traverse((child: unknown) => {
        const sceneChild = child as SceneChild
        sceneChild.geometry?.dispose()
        const materials = Array.isArray(sceneChild.material) ? sceneChild.material : [sceneChild.material]
        materials.forEach((material) => material?.dispose())
      })
      renderer.domElement.remove()
    }
  }, [baseRotationY, float, groundOffset, modelUrl, renderKey, scale])

  return <div className={className} ref={mountRef} aria-hidden="true" />
}

