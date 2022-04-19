<script>
export default {
  name: 'Tags',
  props: {
    tags: {
      type: Array,
      required: true
    },
  },
  methods: {
    tagClick(tag) {
      this.$emit('tag-click', tag);
    }
  }
}
</script>
<template>
<div class="tags">
  <div v-for="tag in tags" class="tag" @click="tagClick(tag)">{{ tag }}</div>
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
  cursor: pointer;
  user-select: none;
}
.tag:hover {
  background: #e0e0e0;
}
p {
  margin: 0;
}
</style>