cat <<EOF
<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
$(cat style.min.css)
</style><script>
$(cat app.min.js)
</script></head><body></body></html>
EOF
