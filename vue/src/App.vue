<script>
let beep = new Audio('/beep.mp3');
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
export default {
  data () {
    return {
      addNovelOpen: false,
      viewNovelOpen: false,
      currentNovel: null,
      link: '',
      novels: [],
      downloading: false,
      novelIdBeingDownloaded: null,
      lines: [],
      search: "",
      addNovelMode: "url",
      title: "",
      text: "",
    }
  },
  methods: {
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
        } else {
          novel.downloaded_chaps = res.curChap;
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
      let limit = this.$refs.rows.clientHeight / 35;
      limit = Math.floor(limit*1.5);
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
      let limit = this.$refs.rows.clientHeight / 35;
      limit = Math.floor(limit*1.5);
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
        this.lines = res.text.split('\n')
      })
      .then(() => {
        let scrollTop = getCookie(`${novel.id}`)
        console.log(`scrollTop: ${scrollTop}`)
        if (scrollTop) {
          this.$refs.text.scrollTo(0, scrollTop)
        }
        // setTimeout(() => {
        //   if (scrollTop) {
        //     this.$refs.text.scrollTo(0, scrollTop)
        //   }
        //   console.log('scrolled!')
        // }, 3000)
      })
    },
    closeNovelView() {
      // get current scroll position
      let scrollTop = this.$refs.text.scrollTop;
      setCookie(this.currentNovel.id, scrollTop);
      console.log(scrollTop)
      this.lines = []
      this.viewNovelOpen = false
    }
  },
  mounted () {
    // let html = this.$refs.rows.innerHTML;
    // this.$refs.rows.innerHTML = html.repeat(100);
    this.loadNovels();
    if (Notification.permission !== "granted") { Notification.requestPermission(); }
  }
}
</script>

<template>
<div class="view-novel-dialog" v-if="viewNovelOpen" ref="text">
  <span class="material-icons-outlined close" @click="closeNovelView">close</span>
  <div class="text">
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
        <a :href="`http://localhost:6001/api/get-novel-text?id=${novel.id}&title=${novel.title.split('\n')[1]}`" class="link">
          <span class="material-icons">open_in_new</span>
        </a>
        <a :href="novel.url" target="_blank" class="link" v-if="novel.url">
          <span class="material-icons-outlined">link</span>
        </a>
      </div>
      <span>{{ novel.date_added.substring(0, novel.date_added.indexOf('T')) }}</span>
      <span style="white-space: pre-wrap; padding-right: 5px;" @click="viewNovel(novel)" class="novel-title">{{ novel.title }}</span>
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
  grid-template-columns: 260px 700px 150px;
  font-weight: bold;
  padding: 10px 0;
}
.header .first {
  padding-left: 100px;
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
  grid-template-columns: 100px 160px 700px 120px 30px;
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
.row .material-icons:hover, a.link:hover {
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
.search {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.material-icons-outlined {
  user-select: none;
}
</style>
