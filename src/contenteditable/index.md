---
title: "Building a contenteditable Text Editor from Scratch"
layout: post.njk
---
_19 Sep 2023_

Around March this year I decided I was going to build a note-taking app, having never been quite satisfied with what was on offer. I wanted something secure, convenient and open. In order to be convenient a notes app must have first class sync support and designed with smartphones in mind. In order to be secure it must be self-hosted or the data must be encrypted client-side.

There are some 

## Prosemirror
If ask online how to create a rich text editor you will be directed to Prosemirror, or its offspring, Tiptap. These work great out of the box, and collaboration is very easy to set up with YJS. However, customizing Prosemirror is hard, so hard that I started writing my own contenteditable editor from scratch. I particular I wanted:
- Drag handles that used PointerEvents, not the drag and drop api, so they could be used on touchscreens
- A mixture of syntax highlighting and rich text
- A relative headings that can opened as their own document

While I wouldn't be surprised to hear that all of these are possible, even easy with Prosemirror or some other editor framework, I wasn't making any progress and I tend to avoid asking questions online.

## YJS
I wanted to be able to sync my application state between devices. I looked at a few different ways of doing this, such as storing the state as text files and syncing with a VCS. CRDTs were the newest, most theoretically complex, and bizarrely the easiest to use. YJS was the obvious choice because it had bindings for every popular text editing framework, so it couldn't be that hard to use.

## `beforeinput`
I am lucky in that when I started writing my editor, `beforeinput` was widely supported.
Rather than handling every keypress you can handle more abstarct events like `insertText` or `deleteContentBackward`, making it much easier to support other languages, keyboard layouts, and input methods. 

The core of my editor looks something like this, obviously greatly simplified, but the principle is the same. Preventing default on all events foces me to handle every update to my state.

```js
const my_doc = ydoc.getText('my document')

root_element.onbeforeinput = (event) => {
    e.preventDefault()
    const offset = getCaretPosition()
    switch (event.inputType) {
        case 'insertText':
            my_doc.insert(offset,e.data)
            return
        case 'delteContentBackward':
            if (offset !== 0) { my_doc.delete(offset-1,1) }
            return
        default:
            return
    }
}
```

## Selection
One of the tricker parts of this project was finding where the text cursor, or caret, is. There wasn't any nice beforeinput feature for this, I had to read the slection from the DOM, and convert that to a yjs document position.

## Rendering
Up until this point I was rolling my own javascript renderer, which was a real pile of junk that redrew the entire page every time the state changed. I was faced with writing a proper renderer or submitting to a component library. I settled on SolidJS after also trying Svelte and React, Svelte was a bit too weird and React is just too old and well supported for my taste. Using SolidJS was a big boost to my productivity, it never made it difficult to drop down to the underlying web apis, which I did a lot, and being able to declare my components in JSX, rather than abusing `Object.assign()` really cleaned up my code. I am not sure if SolidJS was a better choice than react or Svelte, there were a few third party libraries in each I would have liked to have, in particular SyncedStore.
