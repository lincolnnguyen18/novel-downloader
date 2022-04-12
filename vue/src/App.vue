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
export default {
  data () {
    return {
      addNovelOpen: false,
      link: '',
      novels: [],
      downloading: false
    }
  },
  methods: {
    openAddNovel() {
      this.addNovelOpen = true
      setTimeout(() => {
        this.$refs.link.select()
      }, 1)
    },
    deleteNovel(novel) {
      if (confirm("Are you sure you want to delete this novel?")) {
        fetch('http://localhost:3124/api/delete-novel?id=' + novel.id, {
          method: 'POST'
        }).then(() => {
          this.novels = this.novels.filter(n => n.id !== novel.id)
        })
      }
    },
    addNovel() {
      fetch('http://localhost:3124/api/add-novel', {
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
      this.link = ''
      this.addNovelOpen = false
    },
    downloadNovel(novel, length) {
      if (novel.downloaded_chaps == novel.total_chaps) {
        alert("All chapters are already downloaded")
        return
      }
      this.downloading = true
      fetch('http://localhost:3124/api/download-novel', {
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
        if (novel.downloaded_chaps < novel.total_chaps) {
          novel.downloaded_chaps += 1
        }
        this.downloading = false
        if (length < 600000) {
          this.downloadNovel(novel, length + res.length)
        } else {
          notify(novel.title + ' has been downloaded')
        }
      })
    },
    loadNovels() {
      let limit = this.$refs.rows.clientHeight / 35;
      limit = Math.floor(limit);
      fetch('http://localhost:3124/api/get-novels?limit=' + limit)
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.novels = res;
      })
    },
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
<div class="add-novel-dialog dialog" v-if="addNovelOpen">
  <div class="window">
    <div class="title"><b>Add Novel</b></div>
    <div class="subtitle">Type</div>
    <div class="multi-select-wrapper">
      <span class="multi-select selected">Syosetu</span>
      <span class="multi-select">Custom</span>
    </div>
    <div class="subtitle">Link</div>
    <input type="text" v-model="link" placeholder="https://ncode.syosetu.com/..." ref="link" @keyup.enter="link && addNovel()">
    <div class="buttons">
      <button class="secondary" @click="addNovelOpen = false">Cancel</button>
      <button @click="addNovel">Add</button>
    </div>
  </div>
</div>
<div class="navbar">
  <!-- <button>Translated</button> -->
  <button @click="openAddNovel">Add Novel</button>
</div>
<div class="novels">
  <div class="header">
    <span class="first">Date added</span>
    <span>Title</span>
    <span>Downloaded</span>
  </div>
  <div class="rows" ref="rows">
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
  <div class="row" v-for="novel in novels">
      <div class="left">
        <a :href="`http://localhost:3124/api/get-novel-text?id=${novel.id}&title=${novel.title.split('\n')[1]}`" class="link">
          <span class="material-icons">open_in_new</span>
        </a>
        <a :href="novel.url" target="_blank" class="link">
          <span class="material-icons-outlined">link</span>
        </a>
      </div>
      <span>{{ novel.date_added.substring(0, novel.date_added.indexOf('T')) }}</span>
      <span style="white-space: pre-wrap; padding-right: 5px;">{{ novel.title }}</span>
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
  overflow: hidden;
}
.navbar {
  /* background: black; */
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: flex-end;
  position: fixed;
  right: 0;
}
.novels {
  width: 1080px;
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
  height: calc(100% - 39px);
  overflow: auto;
}
.left {
  display: flex;
  gap: 8px;
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
  justify-content: flex-end;
}
.multi-select-wrapper {
  display: flex;
  gap: 45px;
}
.multi-select {
  padding: 10px;
  border-radius: 7px;
  user-select: none;
  cursor: pointer;
  background: white;
  color: black;
}
.multi-select.selected {
  background: black;
  color: white;
  font-weight: bold;
}
input[type="text"] {
  border: none;
  background: #EFEFEF;
  border-radius: 7px;
  padding: 10px;
  width: 350px;
  font-size: 16px;
  color: #333;
  box-sizing: border-box;
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
</style>
