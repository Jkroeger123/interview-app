# AWS S3 Lifecycle Rule Setup for Interview Auto-Deletion

## Purpose

Automatically delete interview video files after 7 days without writing any code. AWS S3 Lifecycle Rules handle this natively.

---

## Setup Instructions

### 1. Open AWS S3 Console

- Navigate to: https://console.aws.amazon.com/s3/
- Select your bucket (e.g., `vysa-interview-recordings`)

### 2. Go to Management Tab

- Click on the bucket name
- Click the **"Management"** tab at the top

### 3. Create Lifecycle Rule

Click **"Create lifecycle rule"** button and configure:

#### Basic Information:
- **Lifecycle rule name**: `delete-expired-interviews`
- **Choose a rule scope**: 
  - Select: ✅ **"Limit the scope using one or more filters"**
  - **Prefix**: `interviews/`
  - This ensures only files in the `interviews/` folder are affected

#### Lifecycle rule actions:
- Select: ✅ **"Expire current versions of objects"**
- **Days after object creation**: `7`

#### Review:
- Verify the configuration
- The rule should show: "Delete objects 7 days after creation for prefix: interviews/"

### 4. Save Rule

- Click **"Create rule"**
- AWS will now automatically delete all files in `interviews/` folder after 7 days

---

## Verification

### Check Rule Status:
1. Go to Management tab → Lifecycle rules
2. You should see: `delete-expired-interviews` with status **"Enabled"**

### Test (Optional):
1. Upload a test file: `interviews/test-deletion.mp4`
2. Change rule temporarily to 1 day (for quick testing)
3. Wait 24 hours
4. Verify file is automatically deleted
5. Change rule back to 7 days

---

## How It Works

```
Day 0:  Video uploaded to S3: interviews/{id}.mp4
Day 1:  Video exists ✅
Day 2:  Video exists ✅
Day 3:  Video exists ✅
Day 4:  Video exists ✅
Day 5:  Video exists ✅
Day 6:  Video exists ✅
Day 7:  AWS automatically deletes video 🗑️
```

---

## Benefits

✅ **No code required** - AWS handles deletion automatically  
✅ **More reliable** - Independent of application uptime  
✅ **Cost effective** - No API calls or compute needed  
✅ **Simple** - One-time setup, works forever  
✅ **Scalable** - Handles millions of files automatically  

---

## Important Notes

- **Lifecycle Rules run once per day** (typically midnight UTC)
- Files may not be deleted exactly at the 7-day mark, but within 24 hours after
- Deleted files **cannot be recovered** (unless versioning is enabled)
- This is a standard AWS feature - no additional charges
- Works independently of your application code

---

## Troubleshooting

### Rule not working?

1. **Check rule is enabled**: Management tab → should show "Enabled"
2. **Verify prefix**: Must be exactly `interviews/` (no leading slash)
3. **Check S3 bucket permissions**: Rule needs `s3:DeleteObject` permission
4. **Wait 24-48 hours**: Rules run once per day, give it time

### Files not deleted?

- Check CloudWatch metrics for lifecycle rule execution
- Verify files are in correct prefix (`interviews/`)
- Ensure rule creation date is before file upload date

---

## AWS CLI Alternative (Optional)

If you prefer using AWS CLI:

```bash
# Create lifecycle-rule.json
cat > lifecycle-rule.json << 'EOF'
{
  "Rules": [
    {
      "Id": "delete-expired-interviews",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "interviews/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
EOF

# Apply to bucket
aws s3api put-bucket-lifecycle-configuration \
  --bucket YOUR-BUCKET-NAME \
  --lifecycle-configuration file://lifecycle-rule.json

# Verify
aws s3api get-bucket-lifecycle-configuration \
  --bucket YOUR-BUCKET-NAME
```

---

## Related Documentation

- [AWS S3 Lifecycle Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Lifecycle Rule Examples](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html)

---

**Setup Time**: ~2 minutes  
**Maintenance Required**: None - set it and forget it!



