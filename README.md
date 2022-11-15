# Strapi plugin Bold title editor

A bold title/text editor to accent certain parts

## Installation

```sh
# Using Yarn
yarn add @ef2/strapi-plugin-bold-title-editor

# Or using NPM
npm install @ef2/strapi-plugin-bold-title-editor
```

Then, you'll need to build your admin panel:

```sh
# Using Yarn
yarn build

# Or using NPM
npm run build
```

## Usage

![bold title editor screenshot](./bold-title-editor.png)

### Next.js

```tsx
<h1 dangerouslySetInnerHTML={{ __html: data.title }} />
<h3><a href="#" dangerouslySetInnerHTML={{ __html: data.subtitle }} /></h3>
```