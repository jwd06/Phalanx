/* global gsap, ScrollTrigger */

(() => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animatedHeadings = document.querySelectorAll('.about-hero h1, .about-section-head h2, .about-showcase h2, .about-cta h2')

    // Split text with plain DOM APIs so the page needs no additional plugin.
    const splitIntoWords = (heading) => {
        const label = heading.textContent.replace(/\s+/g, ' ').trim()
        const textNodes = []
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)

        while (walker.nextNode()) textNodes.push(walker.currentNode)

        textNodes.forEach((node) => {
            const fragment = document.createDocumentFragment()
            const parts = node.textContent.split(/(\s+)/)

            parts.forEach((part) => {
                if (!part) return

                if (/^\s+$/.test(part)) {
                    fragment.appendChild(document.createTextNode(' '))
                    return
                }

                const word = document.createElement('span')
                const inner = document.createElement('span')
                word.className = 'about-word'
                inner.className = 'about-word-inner'
                inner.textContent = part
                inner.setAttribute('aria-hidden', 'true')
                word.appendChild(inner)
                fragment.appendChild(word)
            })

            node.replaceWith(fragment)
        })

        heading.setAttribute('aria-label', label)
        return heading.querySelectorAll('.about-word-inner')
    }

    animatedHeadings.forEach(splitIntoWords)

    if (reduceMotion) {
        document.querySelector('.about-scroll-progress')?.remove()
        return
    }

    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

    heroTimeline
        .from('.site-title', { y: -18, autoAlpha: 0, duration: 0.65 })
        .from('.main-menu li', { y: -14, autoAlpha: 0, duration: 0.5, stagger: 0.07 }, 0.08)
        .from('.about-badge', { y: 18, autoAlpha: 0, duration: 0.55 }, 0.18)

    heroTimeline.add(gsap.from('.about-hero h1 .about-word-inner', {
        yPercent: 115,
        rotate: 2,
        duration: 0.85,
        stagger: 0.055,
        ease: 'power3.out'
    }), 0.28)
        .from('.about-hero-sub', { y: 24, autoAlpha: 0, duration: 0.7 }, 0.58)
        .from('.about-hero-cta > *', { y: 18, autoAlpha: 0, duration: 0.55, stagger: 0.1 }, 0.72)
        .from('.about-hero-image', { x: 54, autoAlpha: 0, duration: 1.05 }, 0.36)
        .from('.about-hero-image img', { scale: 0.94, duration: 1.15 }, 0.36)

    gsap.to('.about-scroll-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
            start: 0,
            end: 'max',
            scrub: 0.2
        }
    })

    gsap.to('.about-hero-image img', {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: {
            trigger: '.about-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8
        }
    })

    const stats = gsap.utils.toArray('.about-stat-num')

    gsap.from('.about-stats-inner > div', {
        y: 30,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-stats-inner',
            start: 'top 86%',
            once: true
        }
    })

    stats.forEach((stat) => {
        const original = stat.textContent.trim()
        const match = original.match(/^(\D*)(\d+)(.*)$/)
        if (!match) return

        const [, prefix, number, suffix] = match
        const counter = { value: 0 }

        gsap.to(counter, {
            value: Number(number),
            duration: 1.35,
            ease: 'power2.out',
            snap: { value: 1 },
            onUpdate: () => {
                stat.textContent = `${prefix}${counter.value}${suffix}`
            },
            scrollTrigger: {
                trigger: '.about-stats-inner',
                start: 'top 86%',
                once: true
            }
        })
    })

    const sectionHeading = document.querySelector('.about-section-head')
    const featureCards = gsap.utils.toArray('.about-feature-card')
    const featureTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: '.about-features',
            start: 'top 78%',
            once: true
        }
    })

    featureTimeline
        .from(sectionHeading.querySelectorAll('.about-word-inner'), {
            yPercent: 110,
            duration: 0.75,
            stagger: 0.045,
            ease: 'power3.out'
        })
        .from(sectionHeading.querySelector('p'), {
            y: 18,
            autoAlpha: 0,
            duration: 0.55,
            ease: 'power2.out'
        }, '-=0.4')
        .from(featureCards, {
            y: 48,
            autoAlpha: 0,
            scale: 0.97,
            duration: 0.72,
            stagger: 0.09,
            ease: 'power3.out',
            onComplete: () => gsap.set(featureCards, { clearProps: 'transform' })
        }, '-=0.2')

    gsap.utils.toArray('.about-showcase').forEach((section, index) => {
        const imageWrap = section.querySelector('.about-showcase-image')
        const image = imageWrap.querySelector('img')
        const text = section.querySelector('.about-showcase-text')
        const heading = text.querySelector('h2')
        const copy = text.querySelector('p')
        const listItems = text.querySelectorAll('.about-checklist li')
        const imageOnLeft = imageWrap === section.querySelector('.about-showcase-inner').firstElementChild
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 74%',
                once: true
            }
        })

        timeline
            .from(imageWrap, {
                x: imageOnLeft ? -60 : 60,
                autoAlpha: 0,
                duration: 0.95,
                ease: 'power3.out'
            })
            .from(image, { scale: 0.92, duration: 1, ease: 'power3.out' }, '<')
            .from(text.querySelector('.about-eyebrow'), {
                y: 18,
                autoAlpha: 0,
                duration: 0.5,
                ease: 'power2.out'
            }, index ? 0.14 : 0.12)
            .from(heading.querySelectorAll('.about-word-inner'), {
                yPercent: 112,
                duration: 0.72,
                stagger: 0.04,
                ease: 'power3.out'
            }, 0.2)
            .from(copy, { y: 20, autoAlpha: 0, duration: 0.58, ease: 'power2.out' }, 0.42)
            .from(listItems, {
                x: 22,
                autoAlpha: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out'
            }, 0.54)

        gsap.fromTo(image, { yPercent: -3 }, {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8
            }
        })
    })

    const ctaTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: '.about-cta',
            start: 'top 82%',
            once: true
        }
    })

    ctaTimeline
        .from('.about-cta', { y: 50, scale: 0.96, autoAlpha: 0, duration: 0.85, ease: 'power3.out' })
        .from('.about-cta h2 .about-word-inner', {
            yPercent: 110,
            duration: 0.7,
            stagger: 0.055,
            ease: 'power3.out'
        }, '-=0.48')
        .from('.about-cta p', { y: 18, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
        .from('.about-cta .about-store-badge', { y: 14, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '-=0.28')

    gsap.from('.about-footer-inner > *', {
        y: 18,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.about-footer',
            start: 'top 94%',
            once: true
        }
    })

    window.addEventListener('load', () => ScrollTrigger.refresh())
})()
