
        // Generate case number on load
        function generateCaseNumber() {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `HC${year}${month}${day}-${random}`;
        }

        // Set initial values
        document.getElementById('caseNumber').value = generateCaseNumber();
        document.getElementById('timestamp').value = new Date().toISOString();

        // Severity selection
        function selectSeverity(level) {
            document.querySelectorAll('.severity-level').forEach(el => {
                el.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
            document.getElementById('severity').value = level;
        }

        // File upload handling
        document.getElementById('fileInput').addEventListener('change', function(e) {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = '';
            
            Array.from(this.files).forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                    <span class="remove-file" onclick="removeFile(${index})">✕</span>
                `;
                fileList.appendChild(fileItem);
            });
        });

        // Remove file function
        function removeFile(index) {
            const dt = new DataTransfer();
            const input = document.getElementById('fileInput');
            
            Array.from(input.files).forEach((file, i) => {
                if (i !== index) dt.items.add(file);
            });
            
            input.files = dt.files;
            
            // Refresh file list
            const event = new Event('change');
            input.dispatchEvent(event);
        }

        // Form submission
        document.getElementById('complaintForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validate severity selection
            if (!document.getElementById('severity').value) {
                alert('Please indicate the severity of the incident');
                return;
            }

            // Collect form data
            const formData = {
                caseNumber: document.getElementById('caseNumber').value,
                timestamp: document.getElementById('timestamp').value,
                fullName: document.getElementById('fullName').value,
                relationship: document.getElementById('relationship').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                contactMethod: document.querySelector('input[name="contactMethod"]:checked').value,
                incidentDate: document.getElementById('incidentDate').value,
                facilityName: document.getElementById('facilityName').value,
                facilityAddress: document.getElementById('facilityAddress').value,
                complaintType: document.getElementById('complaintType').value,
                description: document.getElementById('description').value,
                severity: document.getElementById('severity').value,
                involvedParties: document.getElementById('involvedParties').value,
                witnesses: document.getElementById('witnesses').value,
                reportedTo: Array.from(document.querySelectorAll('input[name="reportedTo"]:checked')).map(cb => cb.value),
                consentContact: document.getElementById('consentContact').checked,
                consentAccurate: document.getElementById('consentAccurate').checked,
                consentTerms: document.getElementById('consentTerms').checked,
                // File attachments would need special handling (FormData for actual upload)
                attachments: Array.from(document.getElementById('fileInput').files).map(f => f.name)
            };

            try {
                // Submit to n8n webhook
                const response = await fetch('https://[your-n8n-instance]/webhook/complaint-received', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    // Show success message
                    document.getElementById('complaintForm').classList.add('hidden');
                    document.getElementById('successMessage').classList.remove('hidden');
                    document.getElementById('displayCaseNumber').textContent = formData.caseNumber;
                    
                    // Optional: Send email confirmation via n8n
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                alert('There was an error submitting your complaint. Please try again or contact support.');
                console.error('Submission error:', error);
            }
        });

        // Reset form
        function resetAndShowForm() {
            document.getElementById('complaintForm').reset();
            document.getElementById('complaintForm').classList.remove('hidden');
            document.getElementById('successMessage').classList.add('hidden');
            
            // Generate new case number
            document.getElementById('caseNumber').value = generateCaseNumber();
            document.getElementById('timestamp').value = new Date().toISOString();
            
            // Clear severity selection
            document.querySelectorAll('.severity-level').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Clear file list
            document.getElementById('fileList').innerHTML = '';
            document.getElementById('fileInput').value = '';
        }

        // Make functions globally available
        window.selectSeverity = selectSeverity;
        window.removeFile = removeFile;
        window.resetAndShowForm = resetAndShowForm;
