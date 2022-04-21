<script>
let beep = new Audio('/beep.mp3');
import Tags from './Tags.vue'
const notify = async (message) => {
  beep.play();
  let notification = new Notification("Novel Downloader", {
    body: message
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  }
}
const getCookie = (key) => {
  let cookie = document.cookie.split('; ')
  for (let i = 0; i < cookie.length; i++) {
    let arr = cookie[i].split('=')
    if (arr[0] === key) {
      return arr[1]
    }
  }
  return ''
}
const setCookie = (key, value) => {
  document.cookie = `${key}=${value}`
}
const splitArrayIntoChunks = (arr, chunkSize) => {
  let results = [];
  while (arr.length) {
    results.push(arr.splice(0, chunkSize));
  }
  return results;
}
export default {
  data () {
    return {
      scrolling: false,
      addNovelOpen: false,
      viewNovelOpen: false,
      viewingSynopsis: false,
      menuNovel: null,
      currentNovel: null,
      link: '',
      novels: [],
      downloading: false,
      novelIdBeingDownloaded: null,
      novelChunks: [],
      novelChunkIndex: 0,
      lines: [],
      search: "",
      addNovelMode: "url",
      title: "",
      text: "",
      loading: false,
    }
  },
  components: {
    Tags
  },
  methods: {
    tagClick (tag) {
      // console.log(`tag clicked: ${tag}`)
      this.search = tag.split('\n')[0]
      this.loadNovels()
    },
    openMenu (novel) {
      if (!this.menuNovel || this.menuNovel.id !== novel.id)
        this.menuNovel = novel
      else
        this.menuNovel = null
    },
    closeAddNovel () {
      this.link = ''
      this.title = ''
      this.text = ''
      this.addNovelMode = "url"
      this.addNovelOpen = false;
    },
    setAddNovelMode: function (mode) {
      this.addNovelMode = mode;
      setTimeout(() => {
        if (mode == 'url') {
        this.$refs.link.select()
      } else {
        this.$refs.title.select()
      }
      }, 1);
    },
    searchNovels (search) {
      this.novels = this.novels.filter(novel => novel.name.toLowerCase().includes(search.toLowerCase()));
    },
    onScroll ({ target: { scrollTop, clientHeight, scrollHeight }}) {
      if (scrollTop + clientHeight >= scrollHeight) {
        console.log('scrolled to bottom')
        this.loadMoreNovels()
      }
    },
    novelProgressbarClick (e) {
      // console.log(e)
      // get click y position
      let y = e.clientY;
      // get percentage of height
      let percent = (y / window.innerHeight) * 100;
      console.log(`clicked at ${percent}%`)
      let oldIndex = this.novelChunkIndex;
      // update novelChunkIndex
      this.novelChunkIndex = Math.floor(percent / 100 * this.novelChunks.length)
      if (oldIndex !== this.novelChunkIndex) {
        // update lines
        this.lines = this.novelChunks[this.novelChunkIndex]
        // update progressbar
        this.$refs.novelprogressbar.style.height = `${percent}%`
      }
    },
    onNovelScroll ({ target: { scrollTop, clientHeight, scrollHeight }}) {
      if (this.viewingSynopsis) return
      if (scrollTop + clientHeight >= scrollHeight) {
        // console.log('scrolled to bottom')
        if (this.novelChunkIndex < this.novelChunks.length - 1) {
          if (!this.scrolling) {
            this.novelChunkIndex++
            console.log('scrolling to chunk', this.novelChunkIndex)
            this.lines = this.novelChunks[this.novelChunkIndex]
            this.$refs.novelprogressbar.style.height = `${(this.novelChunkIndex / this.novelChunks.length) * 100}%`
            // scroll to top
            this.$refs.text.scrollTop = 0
            this.scrolling = true
          } else {
            this.scrolling = false
          }
        }
      }
      // detect scroll to top
      if (scrollTop === 0) {
        // console.log('scrolled to top')
        if (!this.scrolling) {
          if (this.novelChunkIndex > 0) {
            this.novelChunkIndex--
            console.log('scrolling to chunk', this.novelChunkIndex)
            this.lines = this.novelChunks[this.novelChunkIndex]
            this.$refs.novelprogressbar.style.height = `${(this.novelChunkIndex / this.novelChunks.length) * 100}%`
            // scroll to bottom
            this.$refs.text.scrollTo(0, scrollHeight)
            this.scrolling = true
          }
        } else {
          this.scrolling = false
        }
      }
    },
    openAddNovel() {
      this.addNovelOpen = true
      setTimeout(() => {
        this.$refs.link.select()
      }, 1)
    },
    deleteNovel(novel) {
      if (confirm("Are you sure you want to delete this novel?")) {
        fetch('http://localhost:6001/api/delete-novel?id=' + novel.id, {
          method: 'POST'
        }).then(() => {
          this.novels = this.novels.filter(n => n.id !== novel.id)
        })
      }
    },
    addNovel() {
      if (this.addNovelMode == 'url') {
        fetch('http://localhost:6001/api/add-novel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: this.link,
          }),
        })
        .then(res => res.json())
        .then(res => {
          console.log(res)
          if (res.error) {
            alert(res.error)
          } else {
            this.loadNovels()
          }
        })
      } else {
        fetch('http://localhost:6001/api/add-custom-novel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: this.title,
            text: this.text,
          }),
        })
        .then(res => res.json())
        .then(res => {
          console.log(res)
          if (res.error) {
            alert(res.error)
          } else {
            this.loadNovels()
          }
        })
      }
      this.closeAddNovel()
    },
    downloadNovel(novel, length) {
      if (novel.downloaded_chaps == novel.total_chaps) {
        alert("All chapters are already downloaded")
        return
      }
      this.downloading = true
      this.novelIdBeingDownloaded = novel.id
      fetch('http://localhost:6001/api/download-novel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: novel.id,
          url: novel.url,
          curChap: novel.downloaded_chaps,
          lastChap: novel.total_chaps
        }),
      }).then(res => res.json())
      .then(res => {
        console.log(res)
        if (novel.downloaded_chaps < novel.total_chaps && novel.url) {
          novel.downloaded_chaps += 1
          console.log('URL NOVEL')
        } else {
          novel.downloaded_chaps = res.curChap;
          console.log('CUSTOM NOVEL')
          console.log(res)
        }
        this.downloading = false
        let chunkLength = 600000;
        // let chunkLength = 60000;
        length += res.length;
        let progress = length / chunkLength * 100;
        console.log(progress)
        this.$refs.progressbar.style.width = progress + '%'
        if (length < chunkLength && novel.downloaded_chaps < novel.total_chaps) {
          this.downloadNovel(novel, length)
        } else {
          notify(novel.title + ' has been downloaded')
          this.$refs.progressbar.style.width = 0;
        }
      })
    },
    loadNovels() {
      if (this.loading) return
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 100)
      let limit = this.$refs.rows.clientHeight / 35;
      console.log(`limit: ${limit}`)
      fetch(`http://localhost:6001/api/get-novels?limit=${limit}&search=${this.search.trim()}`)
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.novels = res;
        setTimeout(() => {
          // scroll to top
          this.$refs.rows.scrollTop = 0;
        }, 1)
      })
    },
    loadMoreNovels() {
      if (this.loading) return
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 100)
      let limit = this.$refs.rows.clientHeight / 35;
      limit = Math.floor(limit*.3);
      console.log(`limit: ${limit}`)
      fetch(`http://localhost:6001/api/get-novels?limit=${limit}&continue_id=${this.novels[this.novels.length - 1].id}&search=${this.search.trim()}`)
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.novels = this.novels.concat(res);
      })
    },
    viewNovel(novel) {
      this.viewNovelOpen = true
      this.currentNovel = novel
      fetch('http://localhost:6001/api/view-novel-text?id=' + novel.id)
      .then(res => res.json())
      .then(res => {
        this.novelChunks = splitArrayIntoChunks(res.text.split('\n'), 99)
        let novelChunkIndex = getCookie(`${novel.id}_chunk_index`)
        if (novelChunkIndex) {
          this.novelChunkIndex = parseInt(novelChunkIndex)
        } else {
          this.novelChunkIndex = 0
        }
        this.lines = this.novelChunks[this.novelChunkIndex]
        this.$refs.novelprogressbar.style.height = `${(this.novelChunkIndex / this.novelChunks.length) * 100}%`
      })
      .then(() => {
        let scrollTop = getCookie(`${novel.id}`)
        console.log(`scrollTop: ${scrollTop}`)
        if (scrollTop) {
          this.$refs.text.scrollTo(0, scrollTop)
        } else {
          this.$refs.text.scrollTo(0, 0)
        }
        // setTimeout(() => {
        //   if (scrollTop) {
        //     this.$refs.text.scrollTo(0, scrollTop)
        //   }
        //   console.log('scrolled!')
        // }, 3000)
      })
    },
    viewSynopsis(novel) {
      console.log(novel)
      this.currentNovel = null
      this.viewingSynopsis = true
      if (!novel.url) return;
      this.viewNovelOpen = true
      fetch(`http://localhost:6001/api/synopsis/${novel.id}`)
      .then(res => res.json())
      .then(res => {
        this.lines = res.synopsis.split('\n')
      })
    },
    closeNovelView() {
      // get current scroll position
      if (this.currentNovel) {
        let scrollTop = this.$refs.text.scrollTop;
        setCookie(this.currentNovel.id, scrollTop);
        setCookie(`${this.currentNovel.id}_chunk_index`, this.novelChunkIndex);
        console.log(scrollTop)
      }
      this.lines = []
      this.viewNovelOpen = false
      this.viewingSynopsis = false
    }
  },
  mounted () {
    // let html = this.$refs.rows.innerHTML;
    // this.$refs.rows.innerHTML = html.repeat(100);
    setTimeout(() => {
      this.loadNovels()
    }, 1)
    if (Notification.permission !== "granted") { Notification.requestPermission(); }
    // listen to escape to close novel view
    document.addEventListener('keydown', (e) => {
      if (e.key == 'Escape') {
        this.closeNovelView()
        this.menuNovel = null
      }
    })
    // listen to left and right arrow keys
    document.addEventListener('keydown', (e) => {
      if (!this.viewNovelOpen || this.viewingSynopsis) return
      if (e.key == 'ArrowLeft' || e.key == 'a') {
        if (this.novelChunkIndex > 0) {
          this.novelChunkIndex--
          console.log('scrolling to chunk', this.novelChunkIndex)
          this.lines = this.novelChunks[this.novelChunkIndex]
          this.$refs.novelprogressbar.style.height = `${(this.novelChunkIndex / this.novelChunks.length) * 100}%`
        }
        this.scrolling = true
        setTimeout(() => {
          this.$refs.text.scrollTo(0, this.$refs.text.scrollHeight)
        }, 1)
      }
      if (e.key == 'ArrowRight' || e.key == 'd') {
        if (this.novelChunkIndex < this.novelChunks.length - 1) {
          this.novelChunkIndex += 1
          console.log('scrolling to chunk', this.novelChunkIndex)
          this.lines = this.novelChunks[this.novelChunkIndex]
          this.$refs.novelprogressbar.style.height = `${(this.novelChunkIndex / this.novelChunks.length) * 100}%`
        }
        this.scrolling = true
        this.$refs.text.scrollTop = 0
      }
    })
  }
}
</script>

<template>
<div class="view-novel-dialog" v-if="viewNovelOpen" ref="text" @scroll="onNovelScroll">
  <span class="material-icons outlined close" @click="closeNovelView">close</span>
  <div class="text" :class="{bigpadding: !viewingSynopsis}">
    <p v-for="line in lines">{{line}}</p>
  </div>
</div>
<div class="add-novel-dialog dialog" v-if="addNovelOpen">
  <div class="window">
    <div class="top">
      <div class="title"><b>Add Novel</b></div>
      <div class="subtitle">Type</div>
      <div class="multi-select-wrapper">
        <span class="multi-select" @click="setAddNovelMode('url')" :class="{selected: addNovelMode == 'url'}">Syosetu</span>
        <span class="multi-select" @click="setAddNovelMode('custom')" :class="{selected: addNovelMode == 'custom'}">Custom</span>
      </div>
      <div v-if="addNovelMode == 'url'">
        <div class="subtitle">Link</div>
        <input type="text" v-model="link" placeholder="Enter syosetu link here..." ref="link" @keyup.enter="link && addNovel()">
      </div>
      <div v-if="addNovelMode == 'custom'">
        <div class="subtitle">Title</div>
        <input type="text" v-model="title" placeholder="Enter title here..." ref="title">
      </div>
      <div v-if="addNovelMode == 'custom'">
        <div class="subtitle">Text</div>
        <textarea v-model="text" placeholder="Enter text here..." @keyup.enter="title && text && addNovel()"></textarea>
      </div>
    </div>
    <div class="buttons">
      <button class="secondary" @click="closeAddNovel">Cancel</button>
      <button @click="addNovel">Add</button>
    </div>
  </div>
</div>
<div class="progressbar" ref="progressbar"></div>
<div class="novelprogressbar" ref="novelprogressbar" v-if="viewNovelOpen && !viewingSynopsis" @click.capture="novelProgressbarClick"></div>
<div class="novelprogressbarbackground" v-if="viewNovelOpen && !viewingSynopsis" @click.capture="novelProgressbarClick" ref="novelProgressbarBackground"></div>
<div class="search">
  <input type="text" placeholder="Search..." v-model="search" @keyup.enter="loadNovels()">
  <button @click="openAddNovel">Add Novel</button>
</div>
<div class="novels">
  <div class="header">
    <span class="first">Date added</span>
    <span>Title</span>
    <span>Downloaded</span>
  </div>
  <div class="rows" ref="rows" @scroll="onScroll">
    <!-- <div class="row">
      <div class="left">
        <span class="material-icons">open_in_new</span>
        <span class="material-icons-outlined">link</span>
      </div>
      <span>4/3/2022</span>
      <span>Very long novel title</span>
      <span class="download">12/34<span class="material-icons filled">download</span></span>
    </div>
  </div> -->
  <div class="row" v-for="novel in novels" :class="{'downloading-row': downloading && novel.id == novelIdBeingDownloaded}">
      <div class="left">
        <!-- <a :href="`http://localhost:6001/api/get-novel-text?id=${novel.id}&title=${novel.title.split('\n')[1]}`" class="link"><span class="material-icons">open_in_new</span></a> -->
        <!-- <a @click="viewSynopsis(novel)" class="link">
         <span class="material-icons">open_in_new</span>
        </a>
        -->
        <!-- <a :href="novel.url" target="_blank" class="link" v-if="novel.url">
          <span class="material-icons">link</span>
        </a> -->
        <div class="menu-wrapper">
          <span class="material-icons menu-button" @click="openMenu(novel)">menu</span>
          <div class="menu" :class="{'hidden': !menuNovel || menuNovel.id != novel.id}">
            <span @click="viewSynopsis(novel)" v-if="novel.url">View Synopsis</span>
            <span><a :href="`http://localhost:6001/api/get-novel-text?id=${novel.id}&title=${encodeURIComponent(novel.title.split('\n')[1].trim())}`" class="link">Download TXT File</a></span>
            <span v-if="novel.url"><a :href="novel.url" target="_blank" class="link">Open in Syosetu</a></span>
          </div>
        </div>
      </div>
      <span>{{ novel.date_added.substring(0, novel.date_added.indexOf('T')) }}</span>
      <div class="title-wrapper">
        <span style="white-space: pre-wrap; padding-right: 5px;" @click="viewNovel(novel)" class="novel-title">{{ novel.title }}</span>
        <Tags :tags="novel.tags" @tag-click="tagClick"></Tags>
      </div>
      <span
        class="download"
      >{{ novel.downloaded_chaps }}/{{ novel.total_chaps }}
        <span class="material-icons filled" @click="downloadNovel(novel, 0)" :class="{ 'disabled': downloading }">download</span>
        <span class="material-icons" @click="deleteNovel(novel)">delete</span>
      </span>
    </div>
  </div>
</div>
</template>

<style>
html, body, #app {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-y: hidden;
  /* overscroll-behavior-y: none; */
}
.novels {
  width: 1160px;
  /* margin: 10px auto; */
  /* background: blue; */
  height: 100%;
  margin: 0 auto;
}
.header {
  display: grid;
  grid-template-columns: 230px 700px 150px;
  font-weight: bold;
  padding: 10px 0;
}
.header .first {
  padding-left: 70px;
}
.rows {
  height: calc(100% - 39px - 13px - 37px);
  overflow: auto;
}
.left {
  display: flex;
  gap: 22px;
}
.row {
  display: grid;
  grid-template-columns: 70px 160px 700px 120px 30px;
  border-bottom: 1px solid #efefef;
  padding: 5px 0;
}
.row:last-child {
  border-bottom: none;
}
.row span {
  display: flex;
  align-items: center;
}
button {
  border: none;
  padding: 10px;
  border-radius: 7px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  color: white;
  background: black;
  user-select: none;
}
button:hover {
  opacity: 0.5;
}
.download {
  display: grid!important;
  grid-template-columns: 70px 60px 30px;
  /* gap: 8px; */
  align-items: center;
}
button.secondary {
  background: none;
  color: black;
  font-weight: normal;
}
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
h1 {
  margin: 0;
}
.window {
  background: white;
  padding: 16px;
  border-radius: 7px;
  height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.window .title {
  font-size: 24px;
  margin: 10px 0;
}
.subtitle {
  font-weight: bold;
  margin-top: 18px;
  margin-bottom: 6px;
}
.buttons {
  margin-top: 28px;
  display: flex;
  gap: 20px;
  align-self: flex-end;
  justify-content: flex-end;
}
.multi-select-wrapper {
  display: flex;
  gap: 16px;
}
.downloading-row {
  background: #f2f2f2;
}
.multi-select {
  padding: 10px;
  border-radius: 7px;
  user-select: none;
  cursor: pointer;
  background: white;
  color: black;
}
.multi-select:hover {
  background: #f2f2f2;
}
.multi-select.selected {
  background: black;
  color: white;
  font-weight: bold;
}
input[type="text"], textarea {
  border: none;
  background: #EFEFEF;
  border-radius: 7px;
  padding: 10px;
  width: 350px;
  font-size: 16px;
  color: #333;
  box-sizing: border-box;
  font-family: 'Roboto', sans-serif;
  resize: none;
}
a.link {
  color: black;
  text-decoration: none;
  align-self: center;
}
.row .material-icons {
  user-select: none;
  cursor: pointer;
}
.row .material-icons:hover {
  opacity: 0.5;
}
.disabled {
  opacity: 0.1;
  user-select: none;
  cursor: default;
  pointer-events: none;
}
.progressbar {
  width: 0;
  height: 3px;
  background: black;
  position: relative;
  margin-bottom: 10px;
  transition: width 0.1s ease;
  z-index: 99999;
}
.novelprogressbarbackground {
  height: 100%;
  width: 3px;
  background: #efefef;
  position: absolute;
  top: 0;
  left: 0px;
  z-index: 100;
  cursor: pointer;
  opacity: 0.5;
}
.novelprogressbar {
  height: 0;
  width: 3px;
  background: black;
  position: absolute;
  top: 0;
  left: 0px;
  transition: height 0.1s ease;
  z-index: 101;
  cursor: pointer;
}
.view-novel-dialog {
  height: 100%;
  width: 100%;
  background: white;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  overflow: auto;
}
.title-wrapper {
  padding-right: 16px;
}
.novel-title {
  cursor: pointer;
}
.novel-title:hover {
  text-decoration: underline;
}
.view-novel-dialog .close {
  position: fixed;
  top: 16px;
  right: 32px;
  font-size: 32px;
  cursor: pointer;
  user-select: none;
}
.view-novel-dialog .close:hover {
  opacity: 0.5;
}
.text {
  font-size: 18px;
  width: 95%;
  max-width: 800px;
  margin: 0 auto;
  word-break: break-word;
}
.bigpadding {
  /* padding-top: 100px;
  padding-bottom: 200px; */
  padding: 300px 0;
}
.search {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.material-icons {
  user-select: none;
  -webkit-user-select: none;
}
.menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.menu {
  position: absolute;
  left: 40px;
  /* top: 45px; */
  background: white;
  border-radius: 7px;
  align-self: center;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  width: 170px;
}
.menu-button {
  height: fit-content;
}
.menu span {
  padding: 10px;
  border-bottom: 1px solid #efefef;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
}
.menu span:hover {
  background: #f2f2f2;
}
.menu span:last-child {
  border-bottom: none;
}
.hidden {
  display: none;
}
</style>
