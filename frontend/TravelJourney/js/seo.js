// Menaxhuesi i SEO për TravelJourney.al
class SEOManager {
    constructor() {
        this.baseApiUrl = 'https://localhost:7059/api';
        this.baseUrl = 'http://127.0.0.1:5500';
        this.currentPage = this.getCurrentPage();
        
        // Inicializon SEO kur faqja ngarkohet
        this.initializeSEO();
    }

    // Merr emrin e faqes aktuale nga URL
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    // Inicializon SEO bazuar në faqen aktuale
    async initializeSEO() {
        try {
            switch (this.currentPage) {
                case 'index':
                    await this.loadHomepageSEO();
                    break;
                case 'about':
                    await this.loadAboutSEO();
                    break;
                case 'posts':
                    await this.loadPostsPageSEO();
                    break;
                case 'categories':
                    await this.loadCategoriesPageSEO();
                    break;
                case 'singlepost':
                    await this.loadSinglePostSEO();
                    break;
                case 'author':
                    await this.loadAuthorSEO();
                    break;
                default:
                    this.setDefaultSEO();
            }
        } catch (error) {
            console.error('Inicializimi i SEO dështoi:', error);
            this.setDefaultSEO();
        }
    }

    // Ngarkon SEO të faqes kryesore
    async loadHomepageSEO() {
        try {
            const response = await fetch(`${this.baseApiUrl}/blog/seo/homepage`);
            if (response.ok) {
                const seoData = await response.json();
                this.updatePageSEO(seoData);
                this.updateStructuredData('homepage', seoData);
            } else {
                throw new Error('Dështoi në ngarkimin e SEO të faqes kryesore');
            }
        } catch (error) {
            console.error('Gabim në SEO të faqes kryesore:', error);
            this.setDefaultSEO();
        }
    }

    // Ngarkon SEO të faqes "Rreth Nesh"
    async loadAboutSEO() {
        try {
            const response = await fetch(`${this.baseApiUrl}/blog/seo/about`);
            if (response.ok) {
                const seoData = await response.json();
                this.updatePageSEO(seoData);
                this.updateStructuredData('about', seoData);
            } else {
                throw new Error('Dështoi në ngarkimin e SEO të faqes "Rreth Nesh"');
            }
        } catch (error) {
            console.error('Gabim në SEO të faqes "Rreth Nesh":', error);
            this.setDefaultSEO();
        }
    }

    // Ngarkon SEO të faqes së postimeve
    async loadPostsPageSEO() {
        try {
            const response = await fetch(`${this.baseApiUrl}/blog/seo/posts`);
            if (response.ok) {
                const seoData = await response.json();
                this.updatePageSEO(seoData);
                this.updateStructuredData('posts', seoData);
            } else {
                throw new Error('Dështoi në ngarkimin e SEO të faqes së postimeve');
            }
        } catch (error) {
            console.error('Gabim në SEO të faqes së postimeve:', error);
            this.setDefaultSEO();
        }
    }

    // Ngarkon SEO të faqes së kategorive
    async loadCategoriesPageSEO() {
        try {
            const response = await fetch(`${this.baseApiUrl}/blog/seo/categories`);
            if (response.ok) {
                const seoData = await response.json();
                this.updatePageSEO(seoData);
                this.updateStructuredData('categories', seoData);
            } else {
                throw new Error('Dështoi në ngarkimin e SEO të faqes së kategorive');
            }
        } catch (error) {
            console.error('Gabim në SEO të faqes së kategorive:', error);
            this.setDefaultSEO();
        }
    }

    // Ngarkon SEO të postimit individual
    async loadSinglePostSEO() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            
            if (!postId) {
                throw new Error('Nuk u gjet ID e postimit');
            }

            const response = await fetch(`${this.baseApiUrl}/blog/seo/post/${postId}`);
            if (response.ok) {
                const seoData = await response.json();
                this.updatePageSEO(seoData);
                this.updateStructuredData('article', seoData);
            } else {
                throw new Error('Dështoi në ngarkimin e SEO të postimit');
            }
        } catch (error) {
            console.error('Gabim në SEO të postimit individual:', error);
            this.setDefaultSEO();
        }
    }

    // Ngarkon SEO të faqes së autorit
    async loadAuthorSEO() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const authorId = urlParams.get('id');
            
            if (!authorId) {
                throw new Error('Nuk u gjet ID e autorit');
            }

            const response = await fetch(`${this.baseApiUrl}/users/seo/author/${authorId}`);
            if (response.ok) {
                const seoData = await response.json();
                this.updatePageSEO(seoData);
                this.updateStructuredData('profile', seoData);
            } else {
                throw new Error('Dështoi në ngarkimin e SEO të autorit');
            }
        } catch (error) {
            console.error('Gabim në SEO të autorit:', error);
            this.setDefaultSEO();
        }
    }

    // Përditëson elementët e SEO të faqes
    updatePageSEO(seoData) {
        // Përditëson titullin
        if (seoData.title) {
            document.title = seoData.title;
            this.updateElementContent('page-title', seoData.title);
        }

        // Përditëson meta përshkrimin
        if (seoData.description) {
            this.updateMetaContent('page-description', seoData.description);
        }

        // Përditëson meta fjalët kyçe
        if (seoData.keywords) {
            this.updateMetaContent('page-keywords', seoData.keywords);
        }

        // Përditëson URL kanonike
        if (seoData.canonicalUrl) {
            this.updateElementAttribute('page-canonical', 'href', seoData.canonicalUrl);
        }

        // Përditëson tag-et Open Graph
        this.updateOpenGraphTags(seoData);

        // Përditëson tag-et Twitter Card
        this.updateTwitterCardTags(seoData);

        console.log('SEO u përditësua me sukses:', seoData.title);
    }

    // Përditëson meta tag-et Open Graph
    updateOpenGraphTags(seoData) {
        if (seoData.title) {
            this.updateMetaContent('og-title', seoData.title);
        }
        if (seoData.description) {
            this.updateMetaContent('og-description', seoData.description);
        }
        if (seoData.canonicalUrl) {
            this.updateMetaContent('og-url', seoData.canonicalUrl);
        }
        if (seoData.postType) {
            this.updateMetaContent('og-type', seoData.postType);
        }
        if (seoData.imageUrl) {
            this.updateMetaContent('og-image', seoData.imageUrl);
        }
    }

    // Përditëson meta tag-et Twitter Card
    updateTwitterCardTags(seoData) {
        if (seoData.title) {
            this.updateMetaContent('twitter-title', seoData.title);
        }
        if (seoData.description) {
            this.updateMetaContent('twitter-description', seoData.description);
        }
        if (seoData.imageUrl) {
            this.updateMetaContent('twitter-image', seoData.imageUrl);
        }
    }

    // Përditëson të dhënat e strukturuara bazuar në llojin e faqes
    updateStructuredData(pageType, seoData) {
        let structuredData = {};

        switch (pageType) {
            case 'homepage':
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": seoData.siteName || "TravelJourney.al",
                    "description": seoData.description,
                    "url": seoData.canonicalUrl,
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${this.baseUrl}/pages/posts.html?search={search_term_string}`,
                        "query-input": "required name=search_term_string"
                    }
                };
                break;

            case 'article':
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": seoData.title,
                    "description": seoData.description,
                    "author": {
                        "@type": "Person",
                        "name": seoData.authorName || "Autor TravelJourney"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": seoData.siteName || "TravelJourney.al"
                    },
                    "datePublished": seoData.publishedDate,
                    "dateModified": seoData.modifiedDate,
                    "url": seoData.canonicalUrl
                };
                if (seoData.imageUrl) {
                    structuredData.image = seoData.imageUrl;
                }
                break;

            case 'profile':
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": seoData.authorName,
                    "description": seoData.description,
                    "url": seoData.canonicalUrl
                };
                if (seoData.imageUrl) {
                    structuredData.image = seoData.imageUrl;
                }
                break;

            default:
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": seoData.title,
                    "description": seoData.description,
                    "url": seoData.canonicalUrl
                };
        }

        this.updateStructuredDataScript(structuredData);
    }

    // Përditëson script-in e të dhënave të strukturuara
    updateStructuredDataScript(data) {
        const structuredDataElement = document.getElementById('structured-data');
        if (structuredDataElement) {
            structuredDataElement.textContent = JSON.stringify(data, null, 2);
        }
    }

    // Funksion ndihmues për të përditësuar përmbajtjen e elementit
    updateElementContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    // Funksion ndihmues për të përditësuar përmbajtjen meta
    updateMetaContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute('content', content);
        } else {
            // Krijon meta tag nëse nuk ekziston
            const meta = document.createElement('meta');
            meta.id = elementId;
            meta.setAttribute('content', content);
            
            // Vendos atributin e duhur bazuar në ID
            if (elementId.includes('og-')) {
                meta.setAttribute('property', this.getOGProperty(elementId));
            } else if (elementId.includes('twitter-')) {
                meta.setAttribute('name', this.getTwitterProperty(elementId));
            } else {
                meta.setAttribute('name', this.getMetaName(elementId));
            }
            
            document.head.appendChild(meta);
        }
    }

    // Funksion ndihmues për të përditësuar atributin e elementit
    updateElementAttribute(elementId, attribute, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    // Merr emrin e pronësisë Open Graph
    getOGProperty(elementId) {
        const mapping = {
            'og-title': 'og:title',
            'og-description': 'og:description',
            'og-url': 'og:url',
            'og-type': 'og:type',
            'og-image': 'og:image'
        };
        return mapping[elementId] || elementId.replace('og-', 'og:');
    }

    // Merr emrin e pronësisë Twitter
    getTwitterProperty(elementId) {
        const mapping = {
            'twitter-title': 'twitter:title',
            'twitter-description': 'twitter:description',
            'twitter-image': 'twitter:image'
        };
        return mapping[elementId] || elementId.replace('twitter-', 'twitter:');
    }

    // Merr emrin meta
    getMetaName(elementId) {
        const mapping = {
            'page-description': 'description',
            'page-keywords': 'keywords'
        };
        return mapping[elementId] || elementId.replace('page-', '');
    }

    // Vendos SEO të parazgjedhur kur API dështon
    setDefaultSEO() {
        const defaultSEO = {
            title: 'TravelJourney.al - Zbuloni Përvojat Autentike të Udhëtimit Shqiptar',
            description: 'Zbuloni Shqipërinë përmes historive dhe përvojave autentike të udhëtimit të ndara nga udhëtarë të vërtetë. Eksploroni përla të fshehura, kulturën lokale dhe aventura të paharrueshme.',
            keywords: 'Udhëtim Shqipëri, turizmi shqiptar, udhëtim Ballkan, përvojat autentike, blog udhëtimi',
            canonicalUrl: window.location.href,
            postType: 'website'
        };

        this.updatePageSEO(defaultSEO);
        console.log('Duke përdorur të dhënat e parazgjedhura të SEO');
    }

    // Përditësim manual i SEO për përmbajtje dinamike
    static updateSEOForPost(postData) {
        if (!postData) return;

        const seoData = {
            title: `${postData.title} | TravelJourney.al`,
            description: postData.content ? postData.content.substring(0, 155) + '...' : 'Lexoni këtë histori të mahnitshme udhëtimi nga Shqipëria',
            keywords: `${postData.title}, udhëtim Shqipëri, histori udhëtimi`,
            canonicalUrl: `${window.location.origin}/pages/singlepost.html?id=${postData.guid}`,
            authorName: postData.authorName || 'Autor TravelJourney',
            publishedDate: postData.createdAt,
            modifiedDate: postData.updatedAt,
            imageUrl: postData.imageUrl,
            postType: 'article'
        };

        const seoManager = new SEOManager();
        seoManager.updatePageSEO(seoData);
        seoManager.updateStructuredData('article', seoData);
    }

    // Përditësim manual i SEO për faqet e kategorive
    static updateSEOForCategory(categoryData) {
        if (!categoryData) return;

        const seoData = {
            title: `${categoryData.name} - Kategori Udhëtimi | TravelJourney.al`,
            description: `Eksploroni përvojat e udhëtimit ${categoryData.name} në Shqipëri. ${categoryData.description || 'Zbuloni histori dhe këshilla të mahnitshme.'}`,
            keywords: `${categoryData.name}, udhëtim Shqipëri, kategori udhëtimi`,
            canonicalUrl: `${window.location.origin}/pages/categories.html?category=${categoryData.id}`,
            postType: 'website'
        };

        const seoManager = new SEOManager();
        seoManager.updatePageSEO(seoData);
        seoManager.updateStructuredData('categories', seoData);
    }
}

// Inicializon SEO kur DOM ngarkohet
document.addEventListener('DOMContentLoaded', function() {
    // Vonesë e vogël për të siguruar që script-et e tjera janë ngarkuar
    setTimeout(() => {
        new SEOManager();
    }, 100);
});

// Eksporton për përdorim në script-e tjera
window.SEOManager = SEOManager;