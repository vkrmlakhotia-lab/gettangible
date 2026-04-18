import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { createElement } from 'react'
import PageRenderer from '@/components/PageRenderer'
import type { BookPage } from '@/types/book'

const CONTAINER_W = 750
const CONTAINER_H = 531
const SCALE = 3507 / CONTAINER_W // 4.676 → 3507×2483px output

function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'))
  if (imgs.length === 0) return Promise.resolve()
  return Promise.all(
    imgs.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
    )
  ).then(() => undefined)
}

export async function renderBookToPdf(
  pages: BookPage[],
  title: string,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [3507, 2480],
    // @ts-ignore
    hotfixes: ['px_scaling'],
  })

  const container = document.createElement('div')
  container.style.cssText = [
    `position:fixed`,
    `left:-${CONTAINER_W + 100}px`,
    `top:0`,
    `width:${CONTAINER_W}px`,
    `height:${CONTAINER_H}px`,
    `overflow:hidden`,
    `background:#ffffff`,
  ].join(';')
  document.body.appendChild(container)

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      const root = createRoot(container)
      root.render(createElement(PageRenderer, { page, title }))

      await new Promise(r => setTimeout(r, 50))
      await waitForImages(container)

      const canvas = await html2canvas(container, {
        scale: SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      })

      if (i > 0) pdf.addPage([3507, 2480], 'landscape')
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      pdf.addImage(imgData, 'JPEG', 0, 0, 3507, 2480)

      root.unmount()
      onProgress?.(i + 1, pages.length)
    }
  } finally {
    document.body.removeChild(container)
  }

  return pdf.output('blob')
}
