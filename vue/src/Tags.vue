<script>
export default {
  name: 'Tags',
  props: {
    novelId: {
      type: Number,
      required: true
    },
  },
  data() {
    return {
      tags: []
    }
  },
  mounted() {
    fetch(`http://localhost:6001/api/novel-tags/${this.novelId}`)
    .then(res => res.json())
    .then(res => {
      this.tags = res
    })
  },
}
</script>
<template>
<div class="tags">
  <div v-for="tag in tags" class="tag">{{ tag }}</div>
</div>
</template>
<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-start;
  align-items: center;
  margin-top: 7px;
  /* margin-bottom: 12px; */
  font-size: 14px;
}
.tag {
  background: #efefef;
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
}
p {
  margin: 0;
}
</style>